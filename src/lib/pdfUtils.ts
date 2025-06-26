import jsPDF from 'jspdf';

interface QuizResult {
  questionIndex: number;
  questionText: string;
  userAnswerIndex: number;
  userAnswerText: string;
  correctAnswerIndex: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

interface StudentData {
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuizResult[];
  timeSpent?: number;
}

interface BulkData {
  quizTitle: string;
  schoolName: string;
  teacherName: string;
  major: string;
  totalQuestions: number;
  students: StudentData[];
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
export const generateResultsPDF = (data: StudentData, quizInfo: { title: string; schoolName: string; teacherName: string; major: string }) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Define colors
  const primaryColor = [37, 99, 235]; // Blue
  const successColor = [34, 197, 94]; // Green
  const errorColor = [239, 68, 68]; // Red
  const textColor = [55, 65, 81]; // Gray-700
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Quiz Results', 105, 20, { align: 'center' });
  
  // Quiz Info
  let yPos = 45;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  
  doc.text(`Quiz: ${quizInfo.title}`, 20, yPos);
  yPos += 8;
  doc.text(`School: ${quizInfo.schoolName}`, 20, yPos);
  yPos += 8;
  doc.text(`Teacher: ${quizInfo.teacherName}`, 20, yPos);
  yPos += 8;
  doc.text(`Subject: ${quizInfo.major}`, 20, yPos);
  yPos += 15;
  
  // Student Info
  doc.setFontSize(16);
  doc.text(`Student: ${data.userName}`, 20, yPos);
  yPos += 10;
  
  // Score Box
  const scoreColor = data.percentage >= 80 ? successColor : data.percentage >= 60 ? [245, 158, 11] : errorColor;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`Score: ${data.score}/${data.totalQuestions} (${data.percentage}%)`, 105, yPos + 12, { align: 'center' });
  
  yPos += 35;
  
  // Time spent
  if (data.timeSpent) {
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    const minutes = Math.floor(data.timeSpent / 60);
    const seconds = data.timeSpent % 60;
    doc.text(`Time Spent: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, yPos);
    yPos += 15;
  }
  
  // Questions and Answers
  doc.setFontSize(14);
  doc.text('Detailed Results:', 20, yPos);
  yPos += 10;
  
  data.results.forEach((result, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Question
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    const questionText = `Q${index + 1}: ${result.questionText}`;
    const questionLines = doc.splitTextToSize(questionText, 170);
    doc.text(questionLines, 20, yPos);
    yPos += questionLines.length * 5;
    
    // Your Answer
    const answerColor = result.isCorrect ? successColor : errorColor;
    doc.setTextColor(...answerColor);
    doc.text(`Your Answer: ${result.userAnswerText}`, 25, yPos);
    yPos += 6;
    
    // Correct Answer (if wrong)
    if (!result.isCorrect) {
      doc.setTextColor(...successColor);
      doc.text(`Correct Answer: ${result.correctAnswerText}`, 25, yPos);
      yPos += 6;
    }
    
    // Status
    doc.setTextColor(...answerColor);
    doc.text(result.isCorrect ? '✓ Correct' : '✗ Incorrect', 25, yPos);
    yPos += 10;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`${data.userName}_Quiz_Results.pdf`);
};

// Generate PDF for admin bulk results
export const generateBulkResultsPDF = (data: BulkData) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Define colors
  const primaryColor = [37, 99, 235]; // Blue
  const successColor = [34, 197, 94]; // Green
  const errorColor = [239, 68, 68]; // Red
  const textColor = [55, 65, 81]; // Gray-700
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Class Results Summary', 105, 20, { align: 'center' });
  
  // Quiz Info
  let yPos = 45;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  
  doc.text(`Quiz: ${data.quizTitle}`, 20, yPos);
  yPos += 8;
  doc.text(`School: ${data.schoolName}`, 20, yPos);
  yPos += 8;
  doc.text(`Teacher: ${data.teacherName}`, 20, yPos);
  yPos += 8;
  doc.text(`Subject: ${data.major}`, 20, yPos);
  yPos += 8;
  doc.text(`Total Questions: ${data.totalQuestions}`, 20, yPos);
  yPos += 8;
  doc.text(`Total Students: ${data.students.length}`, 20, yPos);
  yPos += 15;
  
  // Statistics
  const averageScore = data.students.reduce((sum, student) => sum + student.percentage, 0) / data.students.length;
  const passCount = data.students.filter(s => s.percentage >= 60).length;
  const excellentCount = data.students.filter(s => s.percentage >= 80).length;
  
  doc.setFontSize(14);
  doc.text('Class Statistics:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.text(`Average Score: ${averageScore.toFixed(1)}%`, 25, yPos);
  yPos += 6;
  doc.text(`Students Passed (≥60%): ${passCount}/${data.students.length}`, 25, yPos);
  yPos += 6;
  doc.text(`Excellent Performance (≥80%): ${excellentCount}/${data.students.length}`, 25, yPos);
  yPos += 15;
  
  // Student Results Table
  doc.setFontSize(12);
  doc.text('Individual Results:', 20, yPos);
  yPos += 10;
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 10, 'F');
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.text('Student Name', 25, yPos);
  doc.text('Score', 100, yPos);
  doc.text('Percentage', 130, yPos);
  doc.text('Time', 160, yPos);
  yPos += 8;
  
  // Student rows
  data.students.forEach((student) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      
      // Repeat header
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 10, 'F');
      doc.setTextColor(...textColor);
      doc.setFontSize(9);
      doc.text('Student Name', 25, yPos);
      doc.text('Score', 100, yPos);
      doc.text('Percentage', 130, yPos);
      doc.text('Time', 160, yPos);
      yPos += 8;
    }
    
    // Student data
    doc.setTextColor(...textColor);
    doc.text(student.userName, 25, yPos);
    doc.text(`${student.score}/${student.totalQuestions}`, 100, yPos);
    
    // Color code percentage
    const percentageColor = student.percentage >= 80 ? successColor : student.percentage >= 60 ? [245, 158, 11] : errorColor;
    doc.setTextColor(...percentageColor);
    doc.text(`${student.percentage}%`, 130, yPos);
    
    // Time
    doc.setTextColor(...textColor);
    if (student.timeSpent) {
      const minutes = Math.floor(student.timeSpent / 60);
      const seconds = student.timeSpent % 60;
      doc.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, 160, yPos);
    } else {
      doc.text('-', 160, yPos);
    }
    
    yPos += 8;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`${data.quizTitle}_Class_Results.pdf`);
}; 