// Main Application
const App = {
    semesters: [],
    savedDataExists: false,
    savedDataCache: null,

    init() {
        this.checkForSavedData();
        this.bindEvents();
        this.render();
    },

    /**
     * Check if there's saved data and show restore modal if so
     */
    checkForSavedData() {
        try {
            const saved = localStorage.getItem('gpa-semesters');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                    this.savedDataCache = parsed;
                    this.savedDataExists = true;
                    this.showRestoreModal(parsed.length);
                    return;
                }
            }
        } catch (e) {
            console.warn('Could not check saved data', e);
        }
        // No saved data - start blank
        this.semesters = [];
    },

    /**
     * Show restore modal with semester count
     */
    showRestoreModal(semCount) {
        const modal = document.getElementById('restoreModal');
        const countEl = document.getElementById('restoreSemCount');
        if (modal && countEl) {
            countEl.textContent = semCount;
            modal.classList.remove('hidden');
            // Prevent body scroll while modal open
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide restore modal
     */
    hideRestoreModal() {
        const modal = document.getElementById('restoreModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    /**
     * User chose to restore previous data
     */
    handleRestore() {
        if (this.savedDataCache) {
            this.semesters = this.savedDataCache;
            this.render();
            UI.showToast(`Restored ${this.semesters.length} semester(s) successfully!`, 'success');
        }
        this.hideRestoreModal();
    },

    /**
     * User chose to start fresh - keep old data in storage but don't load it
     */
    handleStartFresh() {
        this.semesters = [];
        this.render();
        UI.showToast('Started fresh. Previous data is still saved.', 'info');
        this.hideRestoreModal();
    },

    bindEvents() {
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        const uploadArea = document.getElementById('uploadArea');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        document.getElementById('addSemesterBtn').addEventListener('click', () => {
            this.addSemester();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (this.semesters.length === 0) {
                UI.showToast('Nothing to clear', 'info');
                return;
            }
            if (confirm('Are you sure you want to remove all semesters? This will also delete saved data permanently.')) {
                this.semesters = [];
                this.savedDataCache = null;
                this.savedDataExists = false;
                localStorage.removeItem('gpa-semesters');
                this.render();
                UI.showToast('All data cleared permanently', 'success');
            }
        });

        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            const cgpaResult = Calculator.calculateCGPA(this.semesters);
            ExportManager.exportPDF(this.semesters, cgpaResult);
            UI.showToast('PDF exported successfully!', 'success');
        });

        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            const cgpaResult = Calculator.calculateCGPA(this.semesters);
            ExportManager.exportExcel(this.semesters, cgpaResult);
            UI.showToast('Excel exported successfully!', 'success');
        });

        // Restore modal buttons
        const restoreBtn = document.getElementById('restoreBtn');
        const startFreshBtn = document.getElementById('startFreshBtn');
        
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.handleRestore());
        }
        if (startFreshBtn) {
            startFreshBtn.addEventListener('click', () => this.handleStartFresh());
        }

        // Close modal on overlay click (optional - treat as Start Fresh)
        const modal = document.getElementById('restoreModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    // Clicking outside the modal content = treat as start fresh
                    this.handleStartFresh();
                }
            });
        }
    },

    async handleFiles(files) {
        if (!files || files.length === 0) return;

        for (const file of files) {
            try {
                UI.showToast(`Processing: ${file.name}`, 'info');

                const extractedSemesters = await OCRProcessor.processFile(
                    file,
                    (text, pct) => UI.updateProgress(text, pct)
                );

                if (extractedSemesters.length === 0) {
                    UI.showToast('Could not extract data. Please enter manually.', 'error');
                    continue;
                }

                extractedSemesters.forEach(newSem => {
                    newSem.subjects = newSem.subjects.filter(s =>
                        s &&
                        s.code &&
                        s.code.trim() !== '' &&
                        s.grade &&
                        s.grade.trim() !== '' &&
                        s.credits !== undefined &&
                        s.credits !== '' &&
                        s.credits !== null &&
                        !isNaN(parseFloat(s.credits))
                    );

                    if (newSem.subjects.length === 0) return;

                    const existingIndex = this.semesters.findIndex(s => s.semester === newSem.semester);
                    
                    if (existingIndex !== -1) {
                        const existing = this.semesters[existingIndex];
                        const manualSubjects = existing.subjects.filter(s => {
                            return s && s.code && !newSem.subjects.some(ns => ns.code === s.code);
                        });
                        existing.subjects = [...newSem.subjects, ...manualSubjects];
                        existing.subjects = existing.subjects.filter(s =>
                            s && (
                                (s.name && s.name.trim() !== '') ||
                                (s.code && s.code.trim() !== '') ||
                                (s.grade && s.grade.trim() !== '') ||
                                (s.credits !== '' && s.credits !== undefined && s.credits !== null)
                            )
                        );
                    } else {
                        this.semesters.push(newSem);
                    }
                });

                this.semesters.sort((a, b) => a.semester - b.semester);

                UI.showToast(
                    `Extracted ${extractedSemesters.length} semester(s). Please verify grades & credits.`,
                    'success'
                );
            } catch (err) {
                console.error('Processing error:', err);
                UI.showToast(`Error processing ${file.name}: ${err.message}`, 'error');
            }
        }

        this.semesters = this.semesters.filter(sem => sem.subjects.length > 0);

        this.render();
        this.saveToStorage();
        document.getElementById('fileInput').value = '';
    },

    addSemester() {
        const existingNums = this.semesters.map(s => s.semester);
        let nextNum = 1;
        while (existingNums.includes(nextNum)) nextNum++;

        this.semesters.push({
            semester: nextNum,
            subjects: [{ name: '', code: '', grade: '', credits: '' }]
        });

        this.semesters.sort((a, b) => a.semester - b.semester);
        this.render();
        this.saveToStorage();
        UI.showToast(`Semester ${nextNum} added`, 'success');
    },

    removeSemester(index) {
        if (confirm(`Remove Semester ${this.semesters[index].semester} and all its subjects?`)) {
            const semNum = this.semesters[index].semester;
            this.semesters.splice(index, 1);
            this.render();
            this.saveToStorage();
            UI.showToast(`Semester ${semNum} removed`, 'info');
        }
    },

    addSubject(semIndex) {
        this.semesters[semIndex].subjects.push({
            name: '', code: '', grade: '', credits: ''
        });
        this.render();
        this.saveToStorage();
    },

    removeSubject(semIndex, subIndex) {
        this.semesters[semIndex].subjects.splice(subIndex, 1);
        if (this.semesters[semIndex].subjects.length === 0) {
            this.semesters[semIndex].subjects.push({ name: '', code: '', grade: '', credits: '' });
        }
        this.render();
        this.saveToStorage();
    },

    updateSubject(semIndex, subIndex, field, value) {
        if (this.semesters[semIndex] && this.semesters[semIndex].subjects[subIndex]) {
            this.semesters[semIndex].subjects[subIndex][field] = value;
            this.saveToStorage();
            this.render();
        }
    },

    render() {
        UI.renderSemesters(this.semesters);
        UI.renderResults(this.semesters);
    },

    saveToStorage() {
        try {
            // Only save if there's actual data
            if (this.semesters && this.semesters.length > 0) {
                localStorage.setItem('gpa-semesters', JSON.stringify(this.semesters));
                this.savedDataCache = this.semesters;
                this.savedDataExists = true;
            }
        } catch (e) {
            console.warn('Could not save to localStorage', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});