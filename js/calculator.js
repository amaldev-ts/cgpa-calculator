// KTU Grade to Grade Point mapping
const GRADE_POINTS = {
    'S':  10,
    'A+': 9.0,
    'A':  8.5,
    'B+': 8.0,
    'B':  7.5,
    'C+': 7.0,
    'C':  6.5,
    'D':  6.0,
    'P':  5.5,
    'F':  0,
    'FE': 0,
    'I':  0
};

const GRADE_OPTIONS = ['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'I'];

const Calculator = {
    /**
     * Calculate SGPA strictly using KTU formula:
     * SGPA = Σ(Ci × GPi) / ΣCi
     * Failed/incomplete courses are also counted.
     */
    calculateSGPA(subjects) {
        let totalCredits = 0;
        let totalWeighted = 0;

        subjects.forEach(sub => {
            const credits = parseFloat(sub.credits) || 0;
            const grade = sub.grade ? sub.grade.toUpperCase().trim() : '';
            const gp = GRADE_POINTS[grade];

            if (credits > 0 && gp !== undefined) {
                totalCredits += credits;
                totalWeighted += credits * gp;
            }
        });

        if (totalCredits === 0) return { sgpa: 0, totalCredits: 0 };

        const sgpa = totalWeighted / totalCredits;
        return {
            sgpa: Math.round(sgpa * 100) / 100,
            totalCredits
        };
    },

    /**
     * Calculate CGPA strictly using KTU formula:
     * CGPA = Σ(Ci × GPi) / ΣCi across all semesters
     * Percentage = 10 × CGPA - 2.5
     */
    calculateCGPA(semesters) {
        let totalCredits = 0;
        let totalWeighted = 0;

        semesters.forEach(sem => {
            sem.subjects.forEach(sub => {
                const credits = parseFloat(sub.credits) || 0;
                const grade = sub.grade ? sub.grade.toUpperCase().trim() : '';
                const gp = GRADE_POINTS[grade];

                if (credits > 0 && gp !== undefined) {
                    totalCredits += credits;
                    totalWeighted += credits * gp;
                }
            });
        });

        if (totalCredits === 0) {
            return { cgpa: 0, totalCredits: 0, percentage: 0, classification: '-' };
        }

        const cgpa = totalWeighted / totalCredits;
        const roundedCGPA = Math.round(cgpa * 100) / 100;
        const percentage = Math.round((10 * roundedCGPA - 2.5) * 100) / 100;

        let classification = '-';
        if (roundedCGPA >= 8.0) classification = 'First Class with Distinction';
        else if (roundedCGPA >= 6.5) classification = 'First Class';
        else if (roundedCGPA >= 5.5) classification = 'Second Class';
        else if (roundedCGPA > 0) classification = 'Pass';

        return {
            cgpa: roundedCGPA,
            totalCredits,
            percentage: Math.max(0, percentage),
            classification
        };
    },

    /**
     * ✅ NEW: Calculate cumulative CGPA up to a specific semester index
     * Uses same KTU formula: CGPA = Σ(Ci × GPi) / ΣCi
     * @param {Array} semesters - All semesters array
     * @param {Number} uptoIndex - Calculate CGPA up to this index (inclusive)
     * @returns {Object} { cgpa, totalCredits }
     */
    calculateCumulativeCGPA(semesters, uptoIndex) {
        let totalCredits = 0;
        let totalWeighted = 0;

        for (let i = 0; i <= uptoIndex && i < semesters.length; i++) {
            const sem = semesters[i];
            if (!sem.subjects) continue;

            sem.subjects.forEach(sub => {
                const credits = parseFloat(sub.credits) || 0;
                const grade = sub.grade ? sub.grade.toUpperCase().trim() : '';
                const gp = GRADE_POINTS[grade];

                if (credits > 0 && gp !== undefined) {
                    totalCredits += credits;
                    totalWeighted += credits * gp;
                }
            });
        }

        if (totalCredits === 0) return { cgpa: 0, totalCredits: 0 };

        const cgpa = totalWeighted / totalCredits;
        return {
            cgpa: Math.round(cgpa * 100) / 100,
            totalCredits
        };
    },

    /**
     * Get detailed calculation breakdown for transparency
     */
    getBreakdown(subjects) {
        const parts = [];
        let totalCredits = 0;
        let totalWeighted = 0;

        subjects.forEach(sub => {
            const credits = parseFloat(sub.credits) || 0;
            const grade = sub.grade ? sub.grade.toUpperCase().trim() : '';
            const gp = GRADE_POINTS[grade];

            if (credits > 0 && gp !== undefined) {
                const weighted = credits * gp;
                totalCredits += credits;
                totalWeighted += weighted;
                parts.push(`(${credits}×${gp})`);
            }
        });

        return {
            formula: parts.length > 0 ? parts.join(' + ') : 'No valid subjects',
            weighted: totalWeighted,
            credits: totalCredits
        };
    }
};