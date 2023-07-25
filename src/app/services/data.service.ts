import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private data: any = {};
  private fileUrls: string[] = [
    'assets/data/lewis.json',
    'assets/data/ions.json',
    'assets/data/success.json',
  ];

  constructor(private http: HttpClient) { }

  private loadFile(url: string): Promise<any> {
    return this.http.get(url).toPromise();
  }

  async loadData(): Promise<void> {
    const promises: Promise<any>[] = this.fileUrls.map(url => this.loadFile(url));
    const responses: any[] = await Promise.all(promises);
    this.data.lewis = responses[0];
    this.data.ions = responses[1];
    this.data.success = responses[2];
  }

  getLewis(): any {
    return this.data.lewis;
  }

  getIons(): any {
    return this.data.ions;
  }

  getSuccessPhrases(): any {
    return this.data.success;
  }
}
