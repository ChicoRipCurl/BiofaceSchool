import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, BehaviorSubject, tap, of} from 'rxjs';
import { University, Campus, Faculty, Student } from '../interfaces/university';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'https://bioface-school-api.vercel.app';

  private currentUserSubject = new BehaviorSubject<Student | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {

    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
        } catch (e) {
          console.error('Error al analizar la usuario almacenado:', e);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }


  login(email: string, password: string): Observable<Student | null> {
    return this.http.get<Student[]>(`${this.baseUrl}/students`).pipe(
      map(students => {
        const foundStudent = students.find(s =>
          s.email === email && s.password === password
        );
        return foundStudent || null;
      }),
      tap(user => {
        if (user && typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }



  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  updateStudent(student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/students/${student.id}`, student).pipe(
      tap(updatedStudent => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(updatedStudent));
        }
        this.currentUserSubject.next(updatedStudent);
      })
    );
  }

  private campusesCache = new BehaviorSubject<Campus[]>([]);
  private universitiesCache = new BehaviorSubject<University[]>([]);

  getCampuses(): Observable<Campus[]> {
    if (this.campusesCache.value.length) {
      return of(this.campusesCache.value);
    }

    return this.http.get<University[]>(`${this.baseUrl}/universities`).pipe(
      map(response => response[0].campuses),
      tap(campuses => this.campusesCache.next(campuses))
    );
  }

  getCampusName(campusId: number): Observable<string> {
    return this.getCampuses().pipe(
      map(campuses => {
        const campus = campuses.find(c => c.id === campusId);
        return campus ? campus.name : 'Campus no encontrado';
      })
    );
  }

  getFacultyName(campusId: number, facultyId: number): Observable<string> {
    return this.getCampuses().pipe(
      map(campuses => {
        const campus = campuses.find(c => c.id === campusId);
        const faculty = campus?.faculties.find(f => f.id === facultyId);
        return faculty ? faculty.name : 'Facultad no encontrada';
      })
    );
  }

  getUniversities(): Observable<University[]> {
    return this.http.get<University[]>(`${this.baseUrl}/universities`);
  }

  getFaculties(campusId: number): Observable<Faculty[]> {
    return this.http.get<University[]>(`${this.baseUrl}/universities`)
      .pipe(
        map(response => {
          const campus = response[0].campuses.find((c: Campus) => c.id === Number(campusId));
          return campus ? campus.faculties : [];
        })
      );
  }

  getStudents(campusId: number, facultyId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/students`)
      .pipe(
        map(students => students.filter(student =>
          student.campus_id === Number(campusId) &&
          student.faculty_id === Number(facultyId)
        ))
      );
  }

  registerStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/students`, student);
  }



}
