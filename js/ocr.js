// OCR Processing Module
const OCRProcessor = {
    async processFile(file, onProgress) {
        const fileType = file.type;

        if (fileType === 'application/pdf') {
            return await this.processPDF(file, onProgress);
        } else if (fileType.startsWith('image/')) {
            return await this.processImage(file, onProgress);
        } else {
            throw new Error('Unsupported file type');
        }
    },

    async processImage(file, onProgress) {
        onProgress('Initializing OCR engine...', 10);

        const worker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round(m.progress * 70) + 20;
                    onProgress('Recognizing text...', pct);
                }
            }
        });

        onProgress('Processing image...', 20);
        const imageURL = URL.createObjectURL(file);
        const { data: { text } } = await worker.recognize(imageURL);
        URL.revokeObjectURL(imageURL);
        await worker.terminate();

        onProgress('Extracting data...', 95);
        console.log('=== OCR EXTRACTED TEXT ===\n', text);
        const semesters = this.parseText(text);
        onProgress('Done!', 100);
        return semesters;
    },

    async processPDF(file, onProgress) {
        onProgress('Loading PDF...', 5);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const allRows = [];

        for (let i = 1; i <= numPages; i++) {
            onProgress(`Processing page ${i} of ${numPages}...`, Math.round((i / numPages) * 60) + 10);

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const rows = this.groupItemsIntoRows(textContent.items);

            if (rows.length === 0 || rows.every(r => r.items.length === 0)) {
                onProgress(`OCR on page ${i}...`, Math.round((i / numPages) * 60) + 10);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                const worker = await Tesseract.createWorker('eng');
                const { data: { text } } = await worker.recognize(blob);
                await worker.terminate();
                
                console.log(`=== OCR TEXT PAGE ${i} ===\n`, text);
                const ocrRows = text.split('\n').map(line => ({
                    items: line.split(/\s{2,}|\t/).map(t => ({ text: t.trim(), x: 0, endX: 0 })).filter(it => it.text)
                }));
                allRows.push(...ocrRows);
                allRows.push({ items: [{ text: '--- PAGE BREAK ---', x: 0, endX: 0 }] });
            } else {
                allRows.push(...rows);
                allRows.push({ items: [{ text: '--- PAGE BREAK ---', x: 0, endX: 0 }] });
            }
        }

        console.log('=== EXTRACTED ROWS ===');
        allRows.forEach((row, idx) => {
            if (row.items.length === 0) return;
            const text = row.items.map(it => `"${it.text}"@${Math.round(it.x)}`).join(' | ');
            console.log(`Row ${idx}: ${text}`);
        });

        onProgress('Extracting data...', 90);
        const semesters = this.parseRows(allRows);
        
        console.log('=== FINAL SEMESTERS ===');
        console.log(JSON.stringify(semesters, null, 2));
        
        onProgress('Done!', 100);
        return semesters;
    },

    groupItemsIntoRows(items) {
        if (!items || items.length === 0) return [];

        const rows = [];
        const tolerance = 4;

        items.forEach(item => {
            if (!item.str || item.str === '') return;
            const text = item.str;
            if (text.trim() === '') return;
            
            const y = Math.round(item.transform[5]);
            const x = item.transform[4];
            const width = item.width || 0;

            let row = rows.find(r => Math.abs(r.y - y) <= tolerance);
            if (!row) {
                row = { y, items: [] };
                rows.push(row);
            }
            row.items.push({ x, text: text.trim(), endX: x + width });
        });

        rows.sort((a, b) => b.y - a.y);
        rows.forEach(row => row.items.sort((a, b) => a.x - b.x));

        return rows;
    },

    parseRows(rows) {
        const semesters = [];
        let currentSemester = null;
        let lastSubject = null;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.items || row.items.length === 0) continue;

            const tokens = row.items.map(it => it.text);
            const lineRaw = tokens.join(' ');
            const upperLine = lineRaw.toUpperCase();

            const semNum = this.detectSemester(lineRaw);
            if (semNum) {
                if (currentSemester && currentSemester.subjects.length > 0) {
                    semesters.push(currentSemester);
                }
                currentSemester = { semester: semNum, subjects: [] };
                lastSubject = null;
                console.log(`>>> Detected Semester ${semNum}`);
                continue;
            }

            // Reset lastSubject on these stop markers
            if (upperLine.includes('PAGE BREAK') ||
                (upperLine.includes('COURSE NAME') && upperLine.includes('CODE')) ||
                upperLine.match(/\bSGPA\b/) ||
                upperLine.includes('TOTAL EARNED CREDITS') ||
                upperLine.includes('TOTAL CREDITS') ||
                upperLine.includes('EARNED CREDITS') ||
                upperLine.includes('CONTROLLER OF EXAMINATION') ||
                upperLine.includes('SEMESTER GRADE CARD') ||
                upperLine.includes('NAME OF CANDIDATE') ||
                upperLine.includes('NAME OF COLLEGE') ||
                upperLine.includes('REGISTER NO') ||
                upperLine.includes('THIS IS A COMPUTER') ||
                upperLine.includes('MONTH & YEAR') ||
                upperLine.includes('GRADE CARD')) {
                lastSubject = null;
                continue;
            }

            if (!currentSemester) {
                currentSemester = { semester: 1, subjects: [] };
            }

            const subject = this.extractSubjectFromRow(row);
            
            if (subject) {
                const isDup = currentSemester.subjects.some(
                    s => s.code === subject.code && s.code
                );
                if (!isDup) {
                    currentSemester.subjects.push(subject);
                    lastSubject = subject;
                    console.log(`  + Added: ${subject.code} | ${subject.name} | ${subject.grade} | ${subject.credits}`);
                }
            } else {
                // Check if this is a name continuation row
                if (lastSubject && this.isNameContinuation(row, lineRaw)) {
                    const continuationText = this.extractNameContinuation(row);
                    if (continuationText) {
                        lastSubject.name = (lastSubject.name + ' ' + continuationText).trim();
                        console.log(`  ↳ Appended to ${lastSubject.code}: "${continuationText}"`);
                    }
                } else {
                    // If row is not a continuation, clear lastSubject to prevent leaking
                    lastSubject = null;
                }
            }
        }

        if (currentSemester && currentSemester.subjects.length > 0) {
            semesters.push(currentSemester);
        }

        return this.deduplicateSemesters(semesters);
    },

    /**
     * STRICT continuation check:
     * - Must be PURE TEXT (no numbers, no codes, no special tokens)
     * - Must be on the left side (course name column area)
     * - Must NOT contain footer/summary keywords
     */
    isNameContinuation(row, lineRaw) {
        if (!lineRaw || lineRaw.trim().length < 2) return false;
        
        const upper = lineRaw.toUpperCase();
        
        // Reject if contains course code
        if (/\b[A-Z]{2,4}\d{3}[A-Z]?\b/.test(lineRaw)) return false;
        
        // Reject if contains any numbers (continuations are pure text)
        if (/\d/.test(lineRaw)) return false;
        
        // Reject footer/summary keywords
        const stopKeywords = [
            'TOTAL', 'EARNED', 'CREDITS', 'SGPA', 'CGPA', 
            'CONTROLLER', 'EXAMINATION', 'PROGRAM', 'BRANCH',
            'CANDIDATE', 'COLLEGE', 'REGISTER', 'SEMESTER',
            'GRADE CARD', 'MONTH', 'YEAR', 'KTU', 'B.TECH',
            'COMPUTER', 'SIGNATURE', 'GENERATED', 'PHYSICAL'
        ];
        for (const kw of stopKeywords) {
            if (upper.includes(kw)) return false;
        }
        
        // Reject if it's just a single grade letter or short token
        if (/^\s*(S|A\+?|B\+?|C\+?|D|P|FE|F|I)\s*$/i.test(lineRaw.trim())) return false;
        
        // Reject dates
        if (/\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JAN|FEB|MAR|APR|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/i.test(lineRaw)) return false;
        
        // Get first item position - must be on left side (course name column)
        const firstItem = row.items[0];
        if (!firstItem || firstItem.x > 150) return false;
        
        // Reject if any item is far right (would be in code/grade/credits columns)
        for (const it of row.items) {
            if (it.x > 240) return false; // anything beyond course name column = not continuation
        }
        
        // Must contain mostly letters
        const letters = lineRaw.replace(/[^A-Za-z]/g, '');
        const total = lineRaw.replace(/\s/g, '').length;
        if (letters.length < 3) return false;
        if (total > 0 && (letters.length / total) < 0.7) return false; // must be at least 70% letters
        
        return true;
    },

    extractNameContinuation(row) {
        // Only take items in course name column (x < 240)
        const leftItems = row.items.filter(it => it.x < 240);
        if (leftItems.length === 0) return null;
        
        return leftItems.map(it => it.text).join(' ').trim();
    },

    extractSubjectFromRow(row) {
        if (!row || !row.items || row.items.length < 3) return null;

        const items = this.mergePlusSymbols(row.items);

        const codeIdx = items.findIndex(it => {
            const t = it.text.trim();
            return /^[A-Z]{2,4}\d{3}[A-Z]?$/.test(t);
        });
        
        if (codeIdx === -1) return null;

        const code = items[codeIdx].text.trim();

        let grade = null;
        let credits = null;

        for (let i = codeIdx + 1; i < items.length && i < codeIdx + 8; i++) {
            const tok = items[i].text.trim();
            if (!tok) continue;

            if (grade === null) {
                const g = this.normalizeGrade(tok);
                if (g !== null) {
                    grade = g;
                    continue;
                }
            }
            
            if (grade !== null && credits === null) {
                const cleaned = tok.replace(/[^\d.]/g, '');
                const num = parseFloat(cleaned);
                if (!isNaN(num) && num >= 0 && num <= 10) {
                    credits = num;
                    break;
                }
            }
        }

        if (grade === null || credits === null) {
            return null;
        }

        const nameItems = items.slice(0, codeIdx);
        let name = nameItems.map(it => it.text).join(' ').trim();
        name = name.replace(/\s+/g, ' ');
        if (!name || name.length < 2) name = code;

        return { name, code, grade, credits };
    },

    mergePlusSymbols(items) {
        const result = [];
        let i = 0;

        while (i < items.length) {
            const cur = items[i];
            const next = i + 1 < items.length ? items[i + 1] : null;
            const curText = cur.text.trim();

            if (next && /^[SABCDPFI]$/i.test(curText)) {
                const nextText = next.text.trim();
                const gap = next.x - cur.endX;

                if (nextText === '+' && gap < 50) {
                    result.push({ ...cur, text: curText + '+' });
                    i += 2;
                    continue;
                }

                if (nextText.startsWith('+') && gap < 50) {
                    result.push({ ...cur, text: curText + '+' });
                    const rest = nextText.substring(1).trim();
                    if (rest) {
                        result.push({ ...next, text: rest, x: next.x + 5 });
                    }
                    i += 2;
                    continue;
                }
            }

            result.push(cur);
            i++;
        }

        return result;
    },

    parseText(text) {
        const rows = text.split('\n').map(line => ({
            items: line.split(/\t|\s{2,}/).map(t => ({ text: t.trim(), x: 0, endX: 0 })).filter(it => it.text)
        }));
        return this.parseRows(rows);
    },

    detectSemester(line) {
        const upper = line.toUpperCase();

        let m = upper.match(/SEMESTER\s*[:\s]\s*S?(\d{1,2})\b/);
        if (m) {
            const n = parseInt(m[1]);
            if (n >= 1 && n <= 10) return n;
        }

        if (line.length < 20) {
            m = upper.match(/^S(\d)\b/);
            if (m) {
                const n = parseInt(m[1]);
                if (n >= 1 && n <= 10) return n;
            }
        }

        m = upper.match(/\/S(\d)\//);
        if (m) {
            const n = parseInt(m[1]);
            if (n >= 1 && n <= 10) return n;
        }

        return null;
    },

    normalizeGrade(grade) {
        if (grade === null || grade === undefined) return null;
        
        let str = String(grade).toUpperCase();
        str = str.replace(/\s+/g, '');
        str = str.replace(/[^A-Z0-9+]/g, '');
        
        if (!str) return null;

        const validGrades = ['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'I'];
        if (validGrades.indexOf(str) !== -1) {
            return str;
        }

        const mapping = {
            'AT': 'A+', 'BT': 'B+', 'CT': 'C+',
            'AP': 'A+', 'BP': 'B+', 'CP': 'C+',
            'S+': 'S', 'A-': 'A', 'B-': 'B'
        };

        if (mapping[str]) return mapping[str];

        if (str.indexOf('A+') === 0) return 'A+';
        if (str.indexOf('B+') === 0) return 'B+';
        if (str.indexOf('C+') === 0) return 'C+';
        if (str.indexOf('FE') === 0) return 'FE';
        
        const firstChar = str.charAt(0);
        if (['S', 'A', 'B', 'C', 'D', 'P', 'F', 'I'].indexOf(firstChar) !== -1) {
            if (str.charAt(1) === '+' && ['A', 'B', 'C'].indexOf(firstChar) !== -1) {
                return firstChar + '+';
            }
            return firstChar;
        }

        return null;
    },

    deduplicateSemesters(semesters) {
        const map = new Map();
        semesters.forEach(sem => {
            if (map.has(sem.semester)) {
                const existing = map.get(sem.semester);
                sem.subjects.forEach(sub => {
                    const isDup = existing.subjects.some(
                        e => e.code === sub.code && e.code
                    );
                    if (!isDup) existing.subjects.push(sub);
                });
            } else {
                map.set(sem.semester, { ...sem, subjects: [...sem.subjects] });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.semester - b.semester);
    }
};

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}