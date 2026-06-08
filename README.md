<div align="center">

# 🎓 KTU SGPA & CGPA Calculator

### Smart Grade Point Calculator with PDF Auto-Extraction

A modern, intelligent web application that automatically calculates **SGPA** and **CGPA** for KTU B.Tech students by extracting data directly from official semester grade card PDFs — no manual entry required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](#)

[Live Demo](#) • [Report Bug](https://github.com/amaldev-ts/cgpa-calculator/issues) • [Request Feature](https://github.com/amaldev-ts/cgpa-calculator/issues)

</div>

---

## ✨ Features

### 🚀 Core Features
- **📄 PDF Auto-Extraction** — Upload your KTU grade card PDF and let the app extract all course details automatically
- **🧮 Strict KTU Formula** — Uses the official KTU calculation formula: `SGPA / CGPA = Σ(Ci × GPi) / ΣCi`
- **📊 Multi-Semester Support** — Single PDF with multiple semesters? No problem! All extracted in one go
- **✏️ Manual Entry & Editing** — Add semesters manually or edit any extracted data
- **🔄 Live Calculation** — SGPA, CGPA, and percentage update instantly as you edit
- **📈 Calculation Breakdown** — See the exact formula being computed for transparency

### 💼 Export & Backup
- **📥 Export to PDF** — Generate a clean, formatted PDF report of all semesters and CGPA
- **📊 Export to Excel** — Get a structured `.xlsx` file with separate sheets per semester
- **💾 Auto-Save** — All data is saved locally in your browser
- **🔁 Smart Restore** — Returns to your previous session with one click

### 🎨 User Experience
- **🌗 Dark/Light Theme** — Toggle between themes with persistent preference
- **📱 Fully Responsive** — Works flawlessly on desktop, tablet, and mobile
- **🎯 Drag & Drop Upload** — Just drop your PDF anywhere on the upload area
- **🔔 Toast Notifications** — Clear, non-intrusive feedback for every action
- **🎓 Professional UI** — Clean, distraction-free design built for students


## 🎯 Why This Project?

KTU students often spend hours manually calculating their SGPA and CGPA, double-checking grades, and dealing with grade card complexity. This tool was built to:

- ✅ **Save time** by extracting data directly from PDFs
- ✅ **Eliminate errors** with precise formula-based calculations
- ✅ **Provide transparency** with visible calculation breakdowns
- ✅ **Work offline** after first load — your data stays on your device
- ✅ **Be 100% free & open-source** — no signups, no ads, no tracking

---

## 🚀 Getting Started

### Option 1: Use Online (Recommended)
Simply visit the **[Live Demo](https://amaldev-ts.github.io/cgpa-calculator/)** in any modern browser. No installation required.

### Option 2: Run Locally

#### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari, Brave)
- A local web server (because of browser security restrictions for PDF processing)

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/amaldev-ts/cgpa-calculator.git
   cd cgpa-calculator
   ```

2. **Run a local server** (pick one method):

   **Using VS Code Live Server (Easiest):**
   - Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
   - Right-click on `index.html` → **Open with Live Server**

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js:**
   ```bash
   npx serve
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

---

## 📖 How to Use

### 🎯 Method 1: Upload PDF (Auto-Extract)
1. Click **Browse Files** or drag & drop your KTU grade card PDF
2. Wait a few seconds for processing
3. Review the extracted data — **always verify grades and credits** against your original
4. View your SGPA and CGPA instantly
5. Export as PDF or Excel if needed

### ✏️ Method 2: Manual Entry
1. Click **Add Semester**
2. Click **Add Subject** for each course
3. Enter course name, code, select grade, and credits
4. Calculation updates automatically

### 🔄 Restore Session
- When you return to the app, a prompt asks if you want to restore your previous data
- Click **Restore Previous** to continue where you left off
- Click **Start Fresh** to begin a new session (old data is preserved until you click **Clear All**)

---

## 📚 KTU Grading System

The app follows the official **APJ Abdul Kalam Technological University (KTU)** grading scale:

| Grade | Grade Point | Percentage Range |
|-------|-------------|------------------|
| S     | 10.0        | 90% and above    |
| A+    | 9.0         | 85% – 89%        |
| A     | 8.5         | 80% – 84%        |
| B+    | 8.0         | 75% – 79%        |
| B     | 7.5         | 70% – 74%        |
| C+    | 7.0         | 65% – 69%        |
| C     | 6.5         | 60% – 64%        |
| D     | 6.0         | 55% – 59%        |
| P     | 5.5         | 50% – 54%        |
| F     | 0           | Below 50%        |
| FE    | 0           | Failed Eligibility |
| I     | 0           | Incomplete       |

### Classification
- **First Class with Distinction** — CGPA ≥ 8.0
- **First Class** — CGPA ≥ 6.5
- **Second Class** — CGPA ≥ 5.5

### Equivalent Percentage Formula
```
Percentage = (10 × CGPA) − 2.5
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **PDF Processing** | [PDF.js](https://mozilla.github.io/pdf.js/) |
| **PDF Export** | [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| **Excel Export** | [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) |
| **Icons** | [Font Awesome 6](https://fontawesome.com/) |
| **Storage** | Browser LocalStorage |

> **Note:** No backend, no database, no tracking. Everything runs in your browser.

---

## 📁 Project Structure

```
cgpa-calculator/
│
├── index.html                  # Main HTML entry point
│
├── css/
│   └── styles.css              # All styles (light/dark themes)
│
└── js/
    ├── app.js                  # Main application logic
    ├── calculator.js           # SGPA/CGPA calculation engine
    ├── ocr.js                  # PDF text extraction & parsing
    ├── export.js               # PDF & Excel export functionality
    ├── theme.js                # Dark/light theme management
    └── ui.js                   # UI rendering & DOM manipulation
```

---

## ⚠️ Important Notes

> **📌 PDF Only:** This tool currently supports **PDF files only**. Image upload (JPG/PNG) is not supported in this version.

> **📌 Verify Always:** OCR extraction may occasionally misread grades (especially `+` symbols). **Always verify** extracted data against your original grade card before relying on the results.

> **📌 Privacy First:** All processing happens **locally in your browser**. No files are uploaded to any server. Your academic data never leaves your device.

> **📌 Browser Compatibility:** Works best on **Chrome, Edge, Brave, Firefox, and Safari** (latest versions).

---

## 🐛 Known Issues & Limitations

- Image upload (JPG/PNG) is not supported — only PDF files
- Some KTU PDFs with unusual layouts may require manual grade correction
- Very old grade card formats (pre-2019) may not be fully supported
- Lateral entry students: First two semester credits should be manually excluded from CGPA per KTU regulations



## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/amaldev-ts/cgpa-calculator/issues).

### How to contribute:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Amal Dev T S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Developer

<div align="center">

### **Amal Dev T S**
*Computer Science Engineering Student*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/amaldev-ts)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/amaldev_ts)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:amalts5885@gmail.com)

</div>

---

## 🙏 Acknowledgments

- **APJ Abdul Kalam Technological University (KTU)** for the standardized grading system
- **Mozilla PDF.js** team for the powerful PDF parsing library
- **Font Awesome** for the beautiful icons
- All KTU students who provided feedback during testing
- The open-source community ❤️

---

## 💡 Feedback & Support

If you found this project helpful:

- ⭐ **Star this repository** on GitHub
- 🐦 **Share** with fellow KTU students
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/amaldev-ts/cgpa-calculator/issues)
- 💬 **Reach out** via [Email](mailto:amalts5885@gmail.com) or [Instagram](https://instagram.com/amaldev_ts)

---

<div align="center">

### Made with ❤️by AMAL DEV TS for KTU Students by KTU Students

**⬆ [Back to Top](#-ktu-sgpa--cgpa-calculator)**

</div>
