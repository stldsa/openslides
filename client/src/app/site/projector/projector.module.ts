import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CountdownControlsComponent } from './components/countdown-controls/countdown-controls.component';
import { CountdownDialogComponent } from './components/countdown-dialog/countdown-dialog.component';
import { MessageControlsComponent } from './components/message-controls/message-controls.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { PresentationControlComponent } from './components/presentation-control/presentation-control.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorListEntryComponent } from './components/projector-list-entry/projector-list-entry.component';
import { ProjectorRoutingModule } from './projector-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, ProjectorRoutingModule, SharedModule],
    declarations: [
        ProjectorListComponent,
        ProjectorListEntryComponent,
        ProjectorDetailComponent,
        CountdownControlsComponent,
        CountdownDialogComponent,
        MessageControlsComponent,
        MessageDialogComponent,
        PresentationControlComponent
    ],
    entryComponents: [
        CountdownDialogComponent,
        MessageDialogComponent,
        PresentationControlComponent,
        ProjectorListEntryComponent
    ]
})
export class ProjectorModule {}
