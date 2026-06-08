// Main Application
const App = {
    semesters: [],
    savedDataExists: false,
    savedDataCache: null,
    _initialized: false,
    _processing: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this.checkForSavedData();
        this.bindEvents();
        this.render();
    },

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
        this.semesters = [];
    },

    showRestoreModal(semCount) {
        const modal = document.getElementById('restoreModal');
        const countEl = document.getElementById('restoreSemCount');
        if (modal && countEl) {
            countEl.textContent = semCount;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    hideRestoreModal() {
        const modal = document.getElementById('restoreModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    handleRestore() {
        if (this.savedDataCache) {
            this.semesters = this.savedDataCache;
            this.render();
            UI.showToast(`Restored ${this.semesters.length} semester(s) successfully!`, 'success');
        }
        this.hideRestoreModal();
    },

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

        const restoreBtn = document.getElementById('restoreBtn');
        const startFreshBtn = document.getElementById('startFreshBtn');

        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.handleRestore());
        }
        if (startFreshBtn) {
            startFreshBtn.addEventListener('click', () => this.handleStartFresh());
        }

        const modal = document.getElementById('restoreModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.handleStartFresh();
                }
            });
        }
    },

    async handleFiles(files) {
        if (!files || files.length === 0) return;
        if (this._processing) return;
        this._processing = true;

        try {
            const allExtractedSemesters = [];

            for (const file of files) {
                try {
                    UI.showToast(`Processing: ${file.name}`, 'info');

                    const extractedSemesters = await OCRProcessor.processFile(
                        file,
                        (text, pct) => UI.updateProgress(text, pct)
                    );

                    if (extractedSemesters.length === 0) {
                        UI.showToast(`Could not extract data from ${file.name}.`, 'error');
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

                        if (newSem.subjects.length > 0) {
                            allExtractedSemesters.push(newSem);
                        }
                    });

                } catch (err) {
                    console.error('Processing error:', err);
                    UI.showToast(`Error processing ${file.name}: ${err.message}`, 'error');
                }
            }

            if (allExtractedSemesters.length === 0) {
                document.getElementById('fileInput').value = '';
                return;
            }

            const uniqueNewSemesters = new Map();
            allExtractedSemesters.forEach(sem => {
                uniqueNewSemesters.set(sem.semester, sem);
            });

            // ✅ FULL REPLACE — wipe old, show only uploaded
            this.semesters = Array.from(uniqueNewSemesters.values())
                .map(newSem => ({
                    semester: newSem.semester,
                    subjects: newSem.subjects.map(s => ({ ...s, isManual: false }))
                }))
                .filter(sem => sem.subjects.length > 0)
                .sort((a, b) => a.semester - b.semester);

            console.log('Final semesters after upload:',
                this.semesters.map(s => `S${s.semester}(${s.subjects.length})`));

            this.render();
            this.saveToStorage();

            UI.showToast(`Loaded ${this.semesters.length} semester(s) successfully.`, 'success');
        } finally {
            this._processing = false;
            document.getElementById('fileInput').value = '';
        }
    },

    addSemester() {
        const existingNums = this.semesters.map(s => s.semester);
        let nextNum = 1;
        while (existingNums.includes(nextNum)) nextNum++;

        this.semesters.push({
            semester: nextNum,
            subjects: [{ name: '', code: '', grade: '', credits: '', isManual: true }]
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
            name: '', code: '', grade: '', credits: '', isManual: true
        });
        this.render();
        this.saveToStorage();
    },

    removeSubject(semIndex, subIndex) {
        this.semesters[semIndex].subjects.splice(subIndex, 1);
        if (this.semesters[semIndex].subjects.length === 0) {
            this.semesters[semIndex].subjects.push({
                name: '', code: '', grade: '', credits: '', isManual: true
            });
        }
        this.render();
        this.saveToStorage();
    },

    updateSubject(semIndex, subIndex, field, value) {
        if (this.semesters[semIndex] && this.semesters[semIndex].subjects[subIndex]) {
            this.semesters[semIndex].subjects[subIndex][field] = value;
            if (!this.semesters[semIndex].subjects[subIndex].isManual) {
                this.semesters[semIndex].subjects[subIndex].isManual = true;
            }
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
            if (this.semesters && this.semesters.length > 0) {
                localStorage.setItem('gpa-semesters', JSON.stringify(this.semesters));
                this.savedDataCache = this.semesters;
                this.savedDataExists = true;
            } else {
                localStorage.removeItem('gpa-semesters');
            }
        } catch (e) {
            console.warn('Could not save to localStorage', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});