import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudentGradeOverviewResponse, GradeScaleEntryResponse, StudentGradeOverviewItemResponse } from '../models/grades.models';

@Injectable({
  providedIn: 'root'
})
export class GradesService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getOverview(): Observable<StudentGradeOverviewResponse> {
    return this.http.get<StudentGradeOverviewResponse>(`${this.apiUrl}/users/grades/overview`);
  }

  getGradeScale(): Observable<GradeScaleEntryResponse[]> {
    return this.http.get<GradeScaleEntryResponse[]>(`${this.apiUrl}/users/grade-scale`);
  }

  /**
   * Berechnet den gewichteten Notendurchschnitt identisch zur ursprünglichen Logik der Notenansicht.
   * Verwendet ECTS-Gewichtung falls ECTS vorhanden, sonst einfachen Durchschnitt.
   */
  calculateWeightedAverage(items: StudentGradeOverviewItemResponse[]): number | null {
    const gradedItems = items.filter(item => item.grade !== null && item.grade !== undefined);

    if (gradedItems.length === 0) {
      return null;
    }

    const weightedItems = gradedItems.filter(item => (item.ects ?? 0) > 0);

    if (weightedItems.length > 0) {
      const weightedSum = weightedItems.reduce(
        (sum, item) => sum + ((item.grade ?? 0) * (item.ects ?? 0)),
        0
      );
      const totalWeight = weightedItems.reduce((sum, item) => sum + (item.ects ?? 0), 0);

      if (totalWeight > 0) {
        return weightedSum / totalWeight;
      }
    }

    const sum = gradedItems.reduce((acc, item) => acc + (item.grade ?? 0), 0);
    return sum / gradedItems.length;
  }
}
