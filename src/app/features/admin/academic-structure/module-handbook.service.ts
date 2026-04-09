import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CourseOfStudy, Module, InstitutionInfo, ModuleExam, Specialization } from '../admin.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ModuleHandbookService {
  private translate = inject(TranslateService);

  generateHandbook(
    course: CourseOfStudy,
    modules: Module[],
    universityInfo: InstitutionInfo | null,
    specializations: Specialization[],
    examTypes: ModuleExam[],
    lang: string = 'de',
    academicYear?: string
  ) {
    if (!academicYear) {
      const now = new Date();
      const currentYear = now.getFullYear();
      academicYear = now.getMonth() >= 8
        ? `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`;
    }

    const doc = new jsPDF();

    // --- Cover Page ---
    this.addCoverPage(doc, course, universityInfo, academicYear, lang);

    // --- Table of Contents ---
    doc.addPage();
    this.addTableOfContents(doc, course, modules, lang);

    // --- Module Descriptions ---
    modules.forEach((module) => {
      doc.addPage();
      this.addModuleDescription(doc, module, course, specializations, examTypes, lang);
    });

    // Add footer to all pages except cover
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i);
      this.addHeaderFooter(doc, course, universityInfo, i, pageCount, lang);
    }

    const titleBase = lang === 'de' ? 'Modulhandbuch' : 'ModuleHandbook';
    const filename = `${titleBase}_${course.name.replace(/\s+/g, '_')}_${course.degreeType.charAt(0).toUpperCase() + course.degreeType.slice(1).toLowerCase()}.pdf`;
    return {
      blob: doc.output('blob'),
      filename: filename
    };
  }

  private instant(key: string, lang: string): string {
    const translations = (this.translate as any).translations?.[lang] || (this.translate as any).store?.translations?.[lang];
    if (!translations) return key;


    // Support nested keys like 'academicStructure.title'
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      if (result[k]) {
        result = result[k];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  }

  private addHeaderFooter(doc: jsPDF, course: CourseOfStudy, universityInfo: InstitutionInfo | null, pageNum: number, totalPages: number, lang: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 15, pageWidth - 15, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const titleBase = lang === 'de' ? 'Modulhandbuch' : 'Module Handbook';
    doc.text(`${titleBase} ${course.name} (${course.degreeType})`, 15, 12);
    doc.text(universityInfo?.universityName || 'CampusPlatform', pageWidth - 15, 12, { align: 'right' });

    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    const pageLabel = lang === 'de' ? 'Seite' : 'Page';
    const ofLabel = lang === 'de' ? 'von' : 'of';
    doc.text(`${pageLabel} ${pageNum} ${ofLabel} ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US'), 15, pageHeight - 10);

    doc.setTextColor(0, 0, 0);
  }

  private addCoverPage(doc: jsPDF, course: CourseOfStudy, universityInfo: InstitutionInfo | null, academicYear: string, lang: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 5, pageHeight, 'F');

    const logoUrl = '/university-logo.png';
    try {
      doc.addImage(logoUrl, 'PNG', pageWidth / 2 - 12.5, 20, 25, 25);
    } catch (e) {
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1);
      doc.rect(pageWidth / 2 - 12.5, 20, 25, 25);
    }


    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text(universityInfo?.universityName || 'CampusPlatform', pageWidth / 2, 65, { align: 'center' });


    doc.setFontSize(40);
    doc.setTextColor(30, 41, 59);
    const titleMain = lang === 'de' ? 'Modulhandbuch' : 'Module Handbook';
    doc.text(titleMain, pageWidth / 2, 110, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const forCourse = lang === 'de' ? 'für den Studiengang' : 'for the course of study';
    doc.text(forCourse, pageWidth / 2, 125, { align: 'center' });

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(course.name, pageWidth / 2, 145, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(71, 85, 105);
    const degreeLabel = course.degreeType === 'BACHELOR' ? 'Bachelor of Science' : 'Master of Science';
    doc.text(degreeLabel, pageWidth / 2, 160, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const studyYearLabel = lang === 'de' ? 'Studienjahr' : 'Academic Year';
    doc.text(`${studyYearLabel} ${academicYear}`, pageWidth / 2, 200, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(pageWidth / 4, 240, (3 * pageWidth) / 4, 240);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const standLabel = lang === 'de' ? 'Stand' : 'As of';
    doc.text(`${standLabel}: ${new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')}`, pageWidth / 2, 250, { align: 'center' });
    doc.text(universityInfo?.city || '', pageWidth / 2, 257, { align: 'center' });
  }

  private addTableOfContents(doc: jsPDF, course: CourseOfStudy, modules: Module[], lang: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const tocLabel = lang === 'de' ? 'Inhaltsverzeichnis' : 'Table of Contents';
    doc.text(tocLabel, 15, 35);

    const sortedModules = [...modules].sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name));

    let y = 50;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    sortedModules.forEach((m, i) => {
      const text = `${m.name}`;
      const semesterLabel = lang === 'de' ? 'Semester' : 'Semester';
      const semesterText = `${semesterLabel} ${m.semester}`;

      doc.setFont('helvetica', 'bold');
      doc.text(text, 15, y);

      doc.setFont('helvetica', 'normal');
      doc.text(semesterText, pageWidth - 15, y, { align: 'right' });

      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 35;
      }
    });
  }

  private addModuleDescription(doc: jsPDF, module: Module, course: CourseOfStudy, specializations: Specialization[], examTypes: ModuleExam[], lang: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(module.name, 15, 35);

    const spec = specializations.find(s => s.id === module.specializationId);
    const preferredExam = examTypes.find(e => e.id === module.preferredExamTypeId);

    const lecturers = module.lecturers.map(l => {
      const title = l.title ? this.instant('userManagement.academicTitles.' + l.title, lang) : '';
      return `${title} ${l.firstName} ${l.lastName}`.trim();
    }).filter(s => !!s).join(', ');

    const preferredLabel = lang === 'de' ? ' (empfohlen)' : ' (preferred)';

    const examText = module.possibleExamTypes?.length > 0
      ? module.possibleExamTypes.map(e => {
        const name = lang === 'de' ? e.nameDe : e.nameEn;
        return e.id === module.preferredExamTypeId ? `${name}${preferredLabel}` : name;
      }).join(', ')
      : preferredExam
        ? `${lang === 'de' ? preferredExam.nameDe : preferredExam.nameEn}${preferredLabel}`
        : this.instant('academicStructure.none', lang);

    const hoursLabel = this.instant('eventManagement.hours', lang) || (lang === 'de' ? 'Stunden' : 'hours');

    autoTable(doc, {
      startY: 45,
      head: [],
      body: [
        [this.instant('academicStructure.moduleName', lang), module.name],
        [this.instant('academicStructure.specialization', lang), spec ? spec.name : this.instant('academicStructure.noSpecificSpecialization', lang)],
        [this.instant('academicStructure.semester', lang), `${this.instant('academicStructure.semester', lang)} ${module.semester}`],
        [this.instant('academicStructure.workload', lang), `${module.requiredTotalHours} ${hoursLabel}`],
        [lang === 'de' ? 'ECTS-Punkte' : 'ECTS Points', '5'],

        [this.instant('academicStructure.staff', lang), lecturers || 'N.N.'],
        [this.instant('academicStructure.exams', lang), examText],
      ],



      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5, textColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [30, 41, 59] },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 }
    });
  }
}

