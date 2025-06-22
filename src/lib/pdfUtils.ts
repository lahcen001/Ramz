import jsPDF from 'jspdf';

interface StudentResult {
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: any[];
  quizTitle: string;
  schoolName: string;
  teacherName: string;
  major: string;
  timeSpent?: number;
}

interface BulkResults {
  quizTitle: string;
  schoolName: string;
  teacherName: string;
  major: string;
  students: StudentResult[];
  totalQuestions: number;
}

// Helper function to draw rounded rectangle
const drawRoundedRect = (pdf: jsPDF, x: number, y: number, width: number, height: number, radius: number = 3) => {
  pdf.roundedRect(x, y, width, height, radius, radius);
};

// Helper function to draw table with borders
const drawTable = (pdf: jsPDF, data: any[], headers: string[], startX: number, startY: number, colWidths: number[]) => {
  let currentY = startY;
  const rowHeight = 8;
  const headerHeight = 10;
  
  // Draw header background
  pdf.setFillColor(37, 99, 235);
  pdf.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');
  
  // Draw header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  let currentX = startX + 2;
  headers.forEach((header, index) => {
    pdf.text(header, currentX, currentY + 7);
    currentX += colWidths[index];
  });
  
  currentY += headerHeight;
  
  // Draw data rows
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  data.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }
    
    currentX = startX + 2;
    row.forEach((cell: any, colIndex: number) => {
      // Handle text wrapping for long content
      const cellText = String(cell);
      const maxWidth = colWidths[colIndex] - 4;
      const splitText = pdf.splitTextToSize(cellText, maxWidth);
      
      if (splitText.length > 1) {
        // Multi-line cell
        splitText.forEach((line: string, lineIndex: number) => {
          pdf.text(line, currentX, currentY + 6 + (lineIndex * 4));
        });
      } else {
        pdf.text(cellText, currentX, currentY + 6);
      }
      
      currentX += colWidths[colIndex];
    });
    
    currentY += Math.max(rowHeight, splitText?.length * 4 + 4);
  });
  
  // Draw table borders
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  
  // Vertical lines
  currentX = startX;
  colWidths.forEach(width => {
    currentX += width;
    pdf.line(currentX, startY, currentX, currentY);
  });
  
  // Horizontal lines
  pdf.line(startX, startY, startX + colWidths.reduce((a, b) => a + b, 0), startY);
  pdf.line(startX, startY + headerHeight, startX + colWidths.reduce((a, b) => a + b, 0), startY + headerHeight);
  pdf.line(startX, currentY, startX + colWidths.reduce((a, b) => a + b, 0), currentY);
  
  // Left and right borders
  pdf.line(startX, startY, startX, currentY);
  pdf.line(startX + colWidths.reduce((a, b) => a + b, 0), startY, startX + colWidths.reduce((a, b) => a + b, 0), currentY);
  
  return currentY;
};

// Generate PDF for individual student result
export const generateStudentResultPDF = (result: StudentResult, language: string = 'en') => {
  const pdf = new jsPDF();
  
  // Set font
  pdf.setFont('helvetica');
  
  // Header with gradient-like effect
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, 210, 30, 'F');
  
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 25, 210, 5, 'F');
  
  // Logo/Title
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RAMZ', 20, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Quiz Platform', 20, 26);
  
  // Report type
  pdf.setFontSize(16);
  pdf.text(language === 'ar' ? 'تقرير نتائج الطالب' : language === 'fr' ? 'Rapport de Résultats' : 'Student Results Report', 105, 20, { align: 'center' });
  
  let yPos = 45;
  
  // Student Info Card
  pdf.setFillColor(248, 250, 252);
  drawRoundedRect(pdf, 15, yPos, 180, 35);
  pdf.rect(15, yPos, 180, 35, 'F');
  
  pdf.setTextColor(37, 99, 235);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(language === 'ar' ? 'معلومات الطالب والاختبار' : language === 'fr' ? 'Informations Étudiant & Quiz' : 'Student & Quiz Information', 20, yPos + 10);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Two columns layout
  const leftCol = 25;
  const rightCol = 115;
  let infoY = yPos + 18;
  
  pdf.text(`${language === 'ar' ? 'الطالب:' : language === 'fr' ? 'Étudiant:' : 'Student:'} ${result.userName}`, leftCol, infoY);
  pdf.text(`${language === 'ar' ? 'المدرسة:' : language === 'fr' ? 'École:' : 'School:'} ${result.schoolName}`, rightCol, infoY);
  
  infoY += 8;
  pdf.text(`${language === 'ar' ? 'عنوان الاختبار:' : language === 'fr' ? 'Quiz:' : 'Quiz:'} ${result.quizTitle}`, leftCol, infoY);
  pdf.text(`${language === 'ar' ? 'المعلم:' : language === 'fr' ? 'Professeur:' : 'Teacher:'} ${result.teacherName}`, rightCol, infoY);
  
  infoY += 8;
  pdf.text(`${language === 'ar' ? 'المادة:' : language === 'fr' ? 'Matière:' : 'Subject:'} ${result.major}`, leftCol, infoY);
  pdf.text(`${language === 'ar' ? 'التاريخ:' : language === 'fr' ? 'Date:' : 'Date:'} ${new Date().toLocaleDateString()}`, rightCol, infoY);
  
  yPos += 50;
  
  // Performance Summary Card
  let performance = '';
  let performanceColor: [number, number, number] = [0, 0, 0];
  let performanceBgColor: [number, number, number] = [248, 250, 252];
  
  if (result.percentage >= 90) {
    performance = language === 'ar' ? 'ممتاز' : language === 'fr' ? 'Excellent' : 'Excellent';
    performanceColor = [34, 197, 94];
    performanceBgColor = [240, 253, 244];
  } else if (result.percentage >= 80) {
    performance = language === 'ar' ? 'جيد جداً' : language === 'fr' ? 'Très Bien' : 'Very Good';
    performanceColor = [59, 130, 246];
    performanceBgColor = [239, 246, 255];
  } else if (result.percentage >= 70) {
    performance = language === 'ar' ? 'جيد' : language === 'fr' ? 'Bien' : 'Good';
    performanceColor = [234, 179, 8];
    performanceBgColor = [254, 252, 232];
  } else if (result.percentage >= 60) {
    performance = language === 'ar' ? 'مقبول' : language === 'fr' ? 'Passable' : 'Fair';
    performanceColor = [249, 115, 22];
    performanceBgColor = [255, 247, 237];
  } else {
    performance = language === 'ar' ? 'ضعيف' : language === 'fr' ? 'Faible' : 'Poor';
    performanceColor = [239, 68, 68];
    performanceBgColor = [254, 242, 242];
  }
  
  pdf.setFillColor(...performanceBgColor);
  drawRoundedRect(pdf, 15, yPos, 180, 40);
  pdf.rect(15, yPos, 180, 40, 'F');
  
  // Score circle
  pdf.setFillColor(...performanceColor);
  pdf.circle(40, yPos + 20, 15, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${result.percentage}%`, 40, yPos + 23, { align: 'center' });
  
  // Performance details
  pdf.setTextColor(...performanceColor);
  pdf.setFontSize(18);
  pdf.text(performance, 70, yPos + 15);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${language === 'ar' ? 'النتيجة:' : language === 'fr' ? 'Score:' : 'Score:'} ${result.score} ${language === 'ar' ? 'من' : language === 'fr' ? 'sur' : 'out of'} ${result.totalQuestions}`, 70, yPos + 25);
  
  if (result.timeSpent) {
    const minutes = Math.floor(result.timeSpent / 60);
    const seconds = result.timeSpent % 60;
    pdf.text(`${language === 'ar' ? 'الوقت:' : language === 'fr' ? 'Temps:' : 'Time:'} ${minutes}:${seconds.toString().padStart(2, '0')}`, 70, yPos + 35);
  }
  
  yPos += 55;
  
  // Detailed Results Table
  if (result.results && result.results.length > 0) {
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(language === 'ar' ? 'تفاصيل الإجابات' : language === 'fr' ? 'Détails des Réponses' : 'Answer Details', 20, yPos);
    yPos += 15;
    
    // Prepare table data
    const tableHeaders = [
      language === 'ar' ? 'رقم' : language === 'fr' ? 'N°' : 'Q#',
      language === 'ar' ? 'السؤال' : language === 'fr' ? 'Question' : 'Question',
      language === 'ar' ? 'إجابتك' : language === 'fr' ? 'Votre Réponse' : 'Your Answer',
      language === 'ar' ? 'الحالة' : language === 'fr' ? 'Statut' : 'Status'
    ];
    
    const tableData = result.results.map((answer, index) => [
      (index + 1).toString(),
      answer.questionText.length > 45 ? answer.questionText.substring(0, 42) + '...' : answer.questionText,
      answer.userAnswerText.length > 25 ? answer.userAnswerText.substring(0, 22) + '...' : answer.userAnswerText,
      answer.isCorrect 
        ? (language === 'ar' ? '✓ صحيح' : language === 'fr' ? '✓ Correct' : '✓ Correct')
        : (language === 'ar' ? '✗ خطأ' : language === 'fr' ? '✗ Incorrect' : '✗ Wrong')
    ]);
    
    const colWidths = [15, 85, 50, 25];
    
    // Split data into chunks for multiple pages if needed
    const itemsPerPage = 15;
    let dataIndex = 0;
    
    while (dataIndex < tableData.length) {
      if (yPos > 200) {
        pdf.addPage();
        yPos = 20;
        
        // Add header on new page
        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(language === 'ar' ? 'تفاصيل الإجابات (تتمة)' : language === 'fr' ? 'Détails des Réponses (suite)' : 'Answer Details (continued)', 20, yPos);
        yPos += 15;
      }
      
      const endIndex = Math.min(dataIndex + itemsPerPage, tableData.length);
      const pageData = tableData.slice(dataIndex, endIndex);
      
      yPos = drawTable(pdf, pageData, tableHeaders, 15, yPos, colWidths) + 10;
      dataIndex = endIndex;
    }
    
    // Summary statistics
    if (yPos > 220) {
      pdf.addPage();
      yPos = 20;
    }
    
    const correctAnswers = result.results.filter(r => r.isCorrect).length;
    const incorrectAnswers = result.results.length - correctAnswers;
    
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(language === 'ar' ? 'ملخص الأداء' : language === 'fr' ? 'Résumé de Performance' : 'Performance Summary', 20, yPos);
    yPos += 15;
    
    // Statistics boxes
    const boxWidth = 85;
    const boxHeight = 25;
    
    // Correct answers box
    pdf.setFillColor(240, 253, 244);
    pdf.rect(20, yPos, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(1);
    pdf.rect(20, yPos, boxWidth, boxHeight);
    
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(language === 'ar' ? 'الإجابات الصحيحة' : language === 'fr' ? 'Réponses Correctes' : 'Correct Answers', 25, yPos + 10);
    pdf.setFontSize(16);
    pdf.text(correctAnswers.toString(), 25, yPos + 20);
    
    // Incorrect answers box
    pdf.setFillColor(254, 242, 242);
    pdf.rect(110, yPos, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(239, 68, 68);
    pdf.rect(110, yPos, boxWidth, boxHeight);
    
    pdf.setTextColor(239, 68, 68);
    pdf.setFontSize(12);
    pdf.text(language === 'ar' ? 'الإجابات الخاطئة' : language === 'fr' ? 'Réponses Incorrectes' : 'Incorrect Answers', 115, yPos + 10);
    pdf.setFontSize(16);
    pdf.text(incorrectAnswers.toString(), 115, yPos + 20);
  }
  
  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(20, 280, 190, 280);
    
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${language === 'ar' ? 'تم الإنشاء بواسطة منصة رمز للاختبارات' : language === 'fr' ? 'Généré par Ramz Quiz Platform' : 'Generated by Ramz Quiz Platform'}`, 105, 285, { align: 'center' });
    pdf.text(`${language === 'ar' ? 'صفحة' : language === 'fr' ? 'Page' : 'Page'} ${i} ${language === 'ar' ? 'من' : language === 'fr' ? 'de' : 'of'} ${totalPages}`, 105, 290, { align: 'center' });
  }
  
  // Save the PDF
  const fileName = `${result.userName}_${result.quizTitle}_Results.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(fileName);
};

// Generate PDF for admin bulk results
export const generateBulkResultsPDF = (data: BulkResults, language: string = 'en') => {
  const pdf = new jsPDF();
  
  // Set font
  pdf.setFont('helvetica');
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(37, 99, 235);
  pdf.text('Ramz Quiz Platform', 105, 20, { align: 'center' });
  
  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(language === 'ar' ? 'تقرير نتائج الاختبار' : language === 'fr' ? 'Rapport des Résultats' : 'Quiz Results Report', 105, 35, { align: 'center' });
  
  // Quiz Info
  pdf.setFontSize(12);
  let yPos = 50;
  
  pdf.text(`${language === 'ar' ? 'عنوان الاختبار:' : language === 'fr' ? 'Titre du Quiz:' : 'Quiz Title:'} ${data.quizTitle}`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'المدرسة:' : language === 'fr' ? 'École:' : 'School:'} ${data.schoolName}`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'المعلم:' : language === 'fr' ? 'Professeur:' : 'Teacher:'} ${data.teacherName}`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'المادة:' : language === 'fr' ? 'Matière:' : 'Subject:'} ${data.major}`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'عدد المشاركين:' : language === 'fr' ? 'Participants:' : 'Total Participants:'} ${data.students.length}`, 20, yPos);
  yPos += 15;
  
  // Statistics
  const averageScore = data.students.reduce((sum, student) => sum + student.percentage, 0) / data.students.length;
  const highestScore = Math.max(...data.students.map(s => s.percentage));
  const lowestScore = Math.min(...data.students.map(s => s.percentage));
  
  pdf.setFontSize(14);
  pdf.setTextColor(37, 99, 235);
  pdf.text(language === 'ar' ? 'إحصائيات عامة' : language === 'fr' ? 'Statistiques Générales' : 'Overall Statistics', 20, yPos);
  yPos += 12;
  
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${language === 'ar' ? 'المتوسط العام:' : language === 'fr' ? 'Moyenne Générale:' : 'Average Score:'} ${averageScore.toFixed(1)}%`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'أعلى نتيجة:' : language === 'fr' ? 'Score le Plus Élevé:' : 'Highest Score:'} ${highestScore}%`, 20, yPos);
  yPos += 8;
  pdf.text(`${language === 'ar' ? 'أقل نتيجة:' : language === 'fr' ? 'Score le Plus Bas:' : 'Lowest Score:'} ${lowestScore}%`, 20, yPos);
  yPos += 15;
  
  // Student results table
  pdf.setFontSize(14);
  pdf.setTextColor(37, 99, 235);
  pdf.text(language === 'ar' ? 'نتائج الطلاب' : language === 'fr' ? 'Résultats des Étudiants' : 'Student Results', 20, yPos);
  yPos += 12;
  
  // Table headers
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(language === 'ar' ? 'الاسم' : language === 'fr' ? 'Nom' : 'Name', 20, yPos);
  pdf.text(language === 'ar' ? 'النتيجة' : language === 'fr' ? 'Score' : 'Score', 80, yPos);
  pdf.text(language === 'ar' ? 'النسبة' : language === 'fr' ? 'Pourcentage' : 'Percentage', 120, yPos);
  pdf.text(language === 'ar' ? 'التقييم' : language === 'fr' ? 'Niveau' : 'Grade', 160, yPos);
  yPos += 8;
  
  // Draw line under headers
  pdf.line(20, yPos, 190, yPos);
  yPos += 5;
  
  // Student data
  data.students.forEach((student, index) => {
    if (yPos > 270) {
      pdf.addPage();
      yPos = 20;
    }
    
    let grade = '';
    if (student.percentage >= 90) grade = language === 'ar' ? 'ممتاز' : language === 'fr' ? 'Excellent' : 'A';
    else if (student.percentage >= 80) grade = language === 'ar' ? 'جيد جداً' : language === 'fr' ? 'Très Bien' : 'B';
    else if (student.percentage >= 70) grade = language === 'ar' ? 'جيد' : language === 'fr' ? 'Bien' : 'C';
    else if (student.percentage >= 60) grade = language === 'ar' ? 'مقبول' : language === 'fr' ? 'Passable' : 'D';
    else grade = language === 'ar' ? 'ضعيف' : language === 'fr' ? 'Faible' : 'F';
    
    pdf.text(student.userName.substring(0, 25), 20, yPos);
    pdf.text(`${student.score}/${student.totalQuestions}`, 80, yPos);
    pdf.text(`${student.percentage}%`, 120, yPos);
    pdf.text(grade, 160, yPos);
    yPos += 6;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(`${language === 'ar' ? 'تم الإنشاء بواسطة منصة رمز للاختبارات' : language === 'fr' ? 'Généré par Ramz Quiz Platform' : 'Generated by Ramz Quiz Platform'}`, 105, 285, { align: 'center' });
    pdf.text(`${language === 'ar' ? 'التاريخ:' : language === 'fr' ? 'Date:' : 'Date:'} ${new Date().toLocaleDateString()} - ${language === 'ar' ? 'صفحة' : language === 'fr' ? 'Page' : 'Page'} ${i}/${totalPages}`, 105, 290, { align: 'center' });
  }
  
  // Save the PDF
  const fileName = `${data.quizTitle}_All_Results.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(fileName);
}; 