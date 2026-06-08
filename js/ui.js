// UI Manager
const UI = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    createSemesterBlock(semData, index) {
        const block = document.createElement('div');
        block.className = 'semester-block';
        block.dataset.semIndex = index;

        const sgpaResult = Calculator.calculateSGPA(semData.subjects);
        const breakdown = Calculator.getBreakdown(semData.subjects);

        block.innerHTML = `
            <div class="semester-header" onclick="UI.toggleSemester(this)">
                <div class="semester-header-left">
                    <i class="fas fa-chevron-down"></i>
                    <span>Semester ${semData.semester}</span>
                </div>
                <div class="semester-header-right">
                    <span class="semester-sgpa-badge">SGPA: ${sgpaResult.sgpa.toFixed(2)}</span>
                    <button class="btn-icon danger" onclick="event.stopPropagation(); App.removeSemester(${index})" title="Remove Semester">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="semester-body">
                <div class="subject-table-wrapper">
                    <table class="subject-table">
                        <thead>
                            <tr>
                                <th class="col-name">Course Name</th>
                                <th class="col-code">Code</th>
                                <th class="col-grade">Grade</th>
                                <th class="col-credits">Credits</th>
                                <th class="col-action"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${semData.subjects.map((sub, subIdx) => this.createSubjectRow(sub, index, subIdx)).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="semester-actions">
                    <button class="add-subject-btn" onclick="App.addSubject(${index})">
                        <i class="fas fa-plus"></i> Add Subject
                    </button>
                    <button class="add-semester-inline-btn" onclick="App.addSemester()">
                        <i class="fas fa-layer-group"></i> Add Next Semester
                    </button>
                </div>
                <div class="calc-breakdown">
                    <div class="breakdown-title">
                        <i class="fas fa-calculator"></i> Calculation Breakdown
                    </div>
                    <div class="breakdown-formula">
                        ${breakdown.formula}
                    </div>
                    <div class="breakdown-result">
                        SGPA = ${breakdown.weighted.toFixed(2)} / ${breakdown.credits} = <strong>${sgpaResult.sgpa.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `;

        return block;
    },

    createSubjectRow(sub, semIdx, subIdx) {
        const gradeOptions = GRADE_OPTIONS.map(g =>
            `<option value="${g}" ${sub.grade === g ? 'selected' : ''}>${g} (${GRADE_POINTS[g]})</option>`
        ).join('');

        const fullName = this.escapeHtml(sub.name || '');

        return `
            <tr data-sem="${semIdx}" data-sub="${subIdx}">
                <td class="col-name">
                    <div class="name-scroll-wrapper">
                        <input type="text" 
                               class="course-name-input"
                               value="${fullName}" 
                               title="${fullName}"
                               placeholder="Course Name"
                               onchange="App.updateSubject(${semIdx}, ${subIdx}, 'name', this.value)">
                    </div>
                </td>
                <td class="col-code">
                    <input type="text" value="${this.escapeHtml(sub.code || '')}" 
                           placeholder="Code"
                           onchange="App.updateSubject(${semIdx}, ${subIdx}, 'code', this.value)">
                </td>
                <td class="col-grade">
                    <select onchange="App.updateSubject(${semIdx}, ${subIdx}, 'grade', this.value)">
                        <option value="">--</option>
                        ${gradeOptions}
                    </select>
                </td>
                <td class="col-credits">
                    <input type="number" value="${sub.credits || ''}" 
                           placeholder="0" min="0" max="10" step="0.5"
                           onchange="App.updateSubject(${semIdx}, ${subIdx}, 'credits', this.value)">
                </td>
                <td class="col-action">
                    <button class="btn-icon danger" onclick="App.removeSubject(${semIdx}, ${subIdx})" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    toggleSemester(header) {
        const body = header.nextElementSibling;
        const icon = header.querySelector('i');
        body.classList.toggle('collapsed');
        icon.classList.toggle('collapsed');
    },

    renderSemesters(semesters) {
        const container = document.getElementById('semestersContainer');

        if (semesters.length === 0) {
            container.innerHTML = `
                <div class="no-semester-msg">
                    <i class="fas fa-folder-open"></i>
                    <p>No semesters added yet. Upload a score card or add manually.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        semesters.forEach((sem, idx) => {
            container.appendChild(this.createSemesterBlock(sem, idx));
        });
    },

    renderResults(semesters) {
        const section = document.getElementById('resultsSection');
        const sgpaContainer = document.getElementById('sgpaResults');

        if (semesters.length === 0 || semesters.every(s => s.subjects.length === 0)) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        sgpaContainer.innerHTML = '';
        semesters.forEach(sem => {
            const result = Calculator.calculateSGPA(sem.subjects);
            const card = document.createElement('div');
            card.className = 'sgpa-card';
            card.innerHTML = `
                <div class="sem-label">Semester ${sem.semester}</div>
                <div class="sgpa-value">${result.sgpa.toFixed(2)}</div>
                <div class="credits-label">${result.totalCredits} Credits</div>
            `;
            sgpaContainer.appendChild(card);
        });

        const cgpaResult = Calculator.calculateCGPA(semesters);
        document.getElementById('cgpaValue').textContent = cgpaResult.cgpa.toFixed(2);
        document.getElementById('totalCreditsDisplay').textContent = `Total Credits: ${cgpaResult.totalCredits}`;
        document.getElementById('percentageDisplay').textContent = `Percentage: ${cgpaResult.percentage.toFixed(2)}%`;
        document.getElementById('classificationDisplay').textContent = cgpaResult.classification;
    },

    updateProgress(text, percent) {
        const status = document.getElementById('processingStatus');
        const fill = document.getElementById('progressFill');
        const label = document.getElementById('progressText');

        status.classList.remove('hidden');
        fill.style.width = `${percent}%`;
        label.textContent = text;

        if (percent >= 100) {
            setTimeout(() => status.classList.add('hidden'), 1500);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};