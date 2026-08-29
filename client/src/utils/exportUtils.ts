/**
 * Export utilities for analytics data in multiple formats
 */

import type { AnalyticsData } from '../hooks/useAnalyticsData';

// ============================================================================
// JSON EXPORT
// ============================================================================

export const exportToJSON = (
  data: AnalyticsData,
  fileName: string = 'resume-analytics'
): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, `${fileName}.json`);
};

// ============================================================================
// CSV EXPORT
// ============================================================================

export const exportToCSV = (
  data: AnalyticsData,
  fileName: string = 'resume-analytics'
): void => {
  const rows: string[] = [];

  // Header
  rows.push('Resume Analytics Export');
  rows.push(`Generated: ${new Date().toISOString()}`);
  rows.push('');

  // Timeline section
  rows.push('Timeline');
  rows.push('Date,Health Score,ATS Score');
  data.timeline.forEach((entry) => {
    rows.push(
      `"${entry.date}",${entry.healthScore.toFixed(2)},${entry.atsScore.toFixed(2)}`
    );
  });
  rows.push('');

  // Section Strengths
  rows.push('Section Strengths');
  rows.push('Section,Score');
  data.sectionStrengths.forEach((section) => {
    rows.push(`"${section.section}",${section.score}`);
  });
  rows.push('');

  // Skills Radar
  rows.push('Skills Proficiency');
  rows.push('Skill,Proficiency,Market Demand');
  data.skillsRadar.forEach((skill) => {
    rows.push(
      `"${skill.skill}",${skill.proficiency},${skill.demand}`
    );
  });
  rows.push('');

  // Recommendations Tracker
  rows.push('Recommendations Tracker');
  rows.push('Metric,Count');
  rows.push(`Total,${data.recommendationsTracker.total}`);
  rows.push(`Implemented,${data.recommendationsTracker.implemented}`);
  rows.push(`Pending,${data.recommendationsTracker.pending}`);
  rows.push(`Critical,${data.recommendationsTracker.critical}`);
  rows.push('');

  // Industry Comparison
  rows.push('Industry Comparison');
  rows.push('Metric,Your Score,Industry Average');
  data.industryComparison.forEach((comp) => {
    rows.push(`"${comp.metric}",${comp.yourScore},${comp.industryAverage}`);
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${fileName}.csv`);
};

// ============================================================================
// TSVC EXPORT (Tab-Separated Values)
// ============================================================================

export const exportToTSV = (
  data: AnalyticsData,
  fileName: string = 'resume-analytics'
): void => {
  const rows: string[] = [];

  // Timeline section
  rows.push('Timeline');
  rows.push('Date\tHealth Score\tATS Score');
  data.timeline.forEach((entry) => {
    rows.push(
      `${entry.date}\t${entry.healthScore.toFixed(2)}\t${entry.atsScore.toFixed(2)}`
    );
  });
  rows.push('');

  // Section Strengths
  rows.push('Section Strengths');
  rows.push('Section\tScore');
  data.sectionStrengths.forEach((section) => {
    rows.push(`${section.section}\t${section.score}`);
  });
  rows.push('');

  // Skills
  rows.push('Skills');
  rows.push('Skill\tProficiency\tDemand');
  data.skillsRadar.forEach((skill) => {
    rows.push(`${skill.skill}\t${skill.proficiency}\t${skill.demand}`);
  });

  const tsvContent = rows.join('\n');
  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
  downloadFile(blob, `${fileName}.tsv`);
};

// ============================================================================
// HTML EXPORT
// ============================================================================

export const exportToHTML = (
  data: AnalyticsData,
  fileName: string = 'resume-analytics'
): void => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Analytics Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #0b0b0b;
      background: #f9f9f7;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0b0b0b;
      border-bottom: 3px solid #2a78d6;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2a78d6;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 1.5em;
    }
    .meta {
      color: #52514e;
      margin-bottom: 30px;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e1e0d9;
    }
    th {
      background-color: #f9f9f7;
      font-weight: 600;
      color: #0b0b0b;
    }
    tr:hover {
      background-color: #f9f9f7;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #2a78d6 0%, #256abf 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e1e0d9;
      color: #52514e;
      font-size: 0.9em;
      text-align: center;
    }
    @media print {
      body {
        background: white;
      }
      .container {
        box-shadow: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Resume Analytics Report</h1>
    <div class="meta">
      Generated: ${new Date().toLocaleString()}<br>
      Total Sections: ${data.sectionStrengths.length}<br>
      Skills Tracked: ${data.skillsRadar.length}
    </div>

    <h2>📈 Key Metrics</h2>
    <div class="stats">
      <div class="stat-card">
        <h3>Average Health Score</h3>
        <div class="value">${Math.round(
          data.timeline.reduce((sum, entry) => sum + entry.healthScore, 0) /
            data.timeline.length
        )}%</div>
      </div>
      <div class="stat-card">
        <h3>Latest ATS Score</h3>
        <div class="value">${Math.round(
          data.timeline[data.timeline.length - 1]?.atsScore || 0
        )}%</div>
      </div>
      <div class="stat-card">
        <h3>Recommendations</h3>
        <div class="value">${data.recommendationsTracker.implemented}/${data.recommendationsTracker.total}</div>
      </div>
    </div>

    <h2>📋 Section Strengths</h2>
    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.sectionStrengths
          .map(
            (section) => `
          <tr>
            <td>${section.section}</td>
            <td>${section.score}%</td>
            <td>${
              section.score >= 80
                ? '✅ Excellent'
                : section.score >= 60
                ? '⚠️ Good'
                : '🔴 Needs Work'
            }</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <h2>⚙️ Skills Proficiency</h2>
    <table>
      <thead>
        <tr>
          <th>Skill</th>
          <th>Your Proficiency</th>
          <th>Market Demand</th>
          <th>Gap</th>
        </tr>
      </thead>
      <tbody>
        ${data.skillsRadar
          .map(
            (skill) => `
          <tr>
            <td>${skill.skill}</td>
            <td>${skill.proficiency}%</td>
            <td>${skill.demand}%</td>
            <td>${Math.abs(skill.proficiency - skill.demand)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <h2>📊 Industry Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Your Score</th>
          <th>Industry Average</th>
          <th>Difference</th>
        </tr>
      </thead>
      <tbody>
        ${data.industryComparison
          .map(
            (comp) => `
          <tr>
            <td>${comp.metric}</td>
            <td>${comp.yourScore}%</td>
            <td>${comp.industryAverage}%</td>
            <td>${comp.yourScore >= comp.industryAverage ? '+' : ''}${comp.yourScore - comp.industryAverage}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <h2>✅ Recommendations Status</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Recommendations</td>
          <td>${data.recommendationsTracker.total}</td>
        </tr>
        <tr>
          <td>✅ Implemented</td>
          <td>${data.recommendationsTracker.implemented}</td>
        </tr>
        <tr>
          <td>⏳ Pending</td>
          <td>${data.recommendationsTracker.pending}</td>
        </tr>
        <tr>
          <td>🔴 Critical</td>
          <td>${data.recommendationsTracker.critical}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>This is an automated resume analytics report. For detailed analysis, please review the full dashboard.</p>
      <p>&copy; ${new Date().getFullYear()} Resume Analyzer. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, `${fileName}.html`);
};

// ============================================================================
// PDF EXPORT (requires external libraries)
// ============================================================================

/**
 * Export analytics data to PDF
 * Requires: npm install jspdf html2canvas
 *
 * Note: This is a placeholder. To implement, you need to:
 * 1. Install dependencies: npm install jspdf html2canvas
 * 2. Import the libraries in this file
 * 3. Uncomment the implementation below
 */
export const exportToPDF = async (
  elementId: string,
  fileName: string = 'resume-analytics'
): Promise<void> => {
  try {
    // Dynamic import to make it optional
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Handle multiple pages if needed
    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.height;
      if (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
      }
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error: any) {
    console.error('PDF export error:', error);
    throw new Error(
      'PDF export requires jsPDF and html2canvas. Install with: npm install jspdf html2canvas'
    );
  }
};

// ============================================================================
// DOCX EXPORT (requires external libraries)
// ============================================================================

/**
 * Export analytics data to DOCX
 * Requires: npm install docx
 *
 * Note: This is a placeholder. To implement, you need to:
 * 1. Install dependencies: npm install docx
 * 2. Import the library in this file
 * 3. Uncomment the implementation below
 */
export const exportToDocx = async (
  data: AnalyticsData,
  fileName: string = 'resume-analytics'
): Promise<void> => {
  try {
    const { Document, Packer, Paragraph, Table, TableCell, TableRow } = await import('docx');

    const rows: InstanceType<typeof TableRow>[] = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Metric')] }),
          new TableCell({ children: [new Paragraph('Value')] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Total Recommendations')] }),
          new TableCell({ children: [new Paragraph(data.recommendationsTracker.total.toString())] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Implemented')] }),
          new TableCell({ children: [new Paragraph(data.recommendationsTracker.implemented.toString())] }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph('Resume Analytics Report'),
            new Paragraph(`Generated: ${new Date().toLocaleString()}`),
            new Paragraph(''),
            new Paragraph('Recommendations Tracker'),
            new Table({
              width: { size: 100, type: 'pct' },
              rows,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${fileName}.docx`);
  } catch (error: any) {
    console.error('DOCX export error:', error);
    throw new Error(
      'DOCX export requires docx library. Install with: npm install docx'
    );
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generic file download function
 */
const downloadFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Print the analytics dashboard
 */
export const printAnalytics = (): void => {
  window.print();
};

/**
 * Get all export options
 */
export const getExportOptions = () => [
  {
    format: 'json',
    label: '📄 JSON',
    description: 'Raw data in JSON format',
    mimeType: 'application/json',
  },
  {
    format: 'csv',
    label: '📊 CSV',
    description: 'Spreadsheet-compatible format',
    mimeType: 'text/csv',
  },
  {
    format: 'tsv',
    label: '📈 TSV',
    description: 'Tab-separated values',
    mimeType: 'text/tab-separated-values',
  },
  {
    format: 'html',
    label: '🌐 HTML',
    description: 'Web-ready format',
    mimeType: 'text/html',
  },
  {
    format: 'pdf',
    label: '📑 PDF',
    description: 'Professional document (requires jsPDF)',
    mimeType: 'application/pdf',
  },
  {
    format: 'docx',
    label: '📝 DOCX',
    description: 'Microsoft Word format (requires docx)',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
];
