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
    'assets/data/family.json',
    'assets/data/elements.json',
    'assets/data/pictiochimie.json',
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
    this.data.family = responses[3];
    this.data.elements = responses[4];
    this.data.pictiochimie = responses[5];
  }

  getLewis(): any {
    return this.data.lewis;
  }

  getIons(): any {
    return this.data.ions;
  }

  getSuccess(): any {
    return this.data.success;
  }

  getFamily(): any {
    return this.data.family;
  }

  getElements(): any {
    return this.data.elements;
  }

  getPictiochimie(): any {
    return this.data.pictiochimie;
  }
}
