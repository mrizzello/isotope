import { Inject, Injectable, DOCUMENT } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document
  ) {}

  checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Mise à jour disponible',
            message: 'Une nouvelle version est disponible. Mettre à jour maintenant ?',
            confirmLabel: 'Mettre à jour',
            cancelLabel: 'Plus tard'
          },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            return;
          }
          this.swUpdate.activateUpdate().then(() => this.document.location.reload());
        });
      }
    });
  }
}
