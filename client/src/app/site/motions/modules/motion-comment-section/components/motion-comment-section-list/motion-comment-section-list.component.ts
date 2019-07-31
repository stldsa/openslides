import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionCommentSection } from 'app/site/motions/models/view-motion-comment-section';
import { ViewGroup } from 'app/site/users/models/view-group';

/**
 * List view for the comment sections.
 */
@Component({
    selector: 'os-motion-comment-section-list',
    templateUrl: './motion-comment-section-list.component.html',
    styleUrls: ['./motion-comment-section-list.component.scss']
})
export class MotionCommentSectionListComponent extends BaseViewComponent implements OnInit {
    @ViewChild('motionCommentDialog', { static: true })
    private motionCommentDialog: TemplateRef<string>;

    public currentComment: ViewMotionCommentSection | null;

    public dialogRef: MatDialogRef<string, any>;

    /**
     * Source of the Data
     */
    public commentSections: ViewMotionCommentSection[] = [];

    /**
     * formgroup for editing and creating of comments
     */
    public commentFieldForm: FormGroup;

    public openId: number | null;

    public groups: BehaviorSubject<ViewGroup[]>;

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     * @param DS
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private repo: MotionCommentSectionRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private dialog: MatDialog,
        private groupRepo: GroupRepositoryService
    ) {
        super(titleService, translate, matSnackBar);

        const form = {
            name: ['', Validators.required],
            read_groups_id: [[]],
            write_groups_id: [[]]
        };
        this.commentFieldForm = this.formBuilder.group(form);
    }

    /**
     * Init function.
     */
    public ngOnInit(): void {
        super.setTitle('Comment fields');
        this.groups = this.groupRepo.getViewModelListBehaviorSubject();
        this.repo.getViewModelListObservable().subscribe(newViewSections => (this.commentSections = newViewSections));
    }

    /**
     * Event on Key Down in form.
     *
     * @param event the keyboard event
     * @param the current view in scope
     */
    public onKeyDown(event: KeyboardEvent, viewSection?: ViewMotionCommentSection): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.save();
        }
        if (event.key === 'Escape') {
            this.cancel();
        }
    }

    /**
     * Opens the create dialog.
     */
    public openDialog(c?: ViewMotionCommentSection): void {
        this.currentComment = c;
        this.commentFieldForm.reset({
            name: c ? c.name : '',
            read_groups_id: c ? c.read_groups_id : [],
            write_groups_id: c ? c.write_groups_id : []
        });
        this.dialogRef = this.dialog.open(this.motionCommentDialog, {
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: true
        });
    }

    /**
     * saves the current data, either updating an existing comment or creating a new one.
     */
    public save(): void {
        if (this.commentFieldForm.valid) {
            // eiher update or create
            if (this.currentComment) {
                this.repo
                    .update(this.commentFieldForm.value as Partial<MotionCommentSection>, this.currentComment)
                    .then(() => this.dialogRef.close(), this.raiseError);
            } else {
                const c = new MotionCommentSection(this.commentFieldForm.value);
                this.repo.create(c).then(() => this.dialogRef.close(), this.raiseError);
            }
        }
    }

    /**
     * close the dialog
     */
    public cancel(): void {
        this.dialogRef.close();
    }

    /**
     * is executed, when the delete button is pressed
     * @param viewSection The section to delete
     */
    public async onDeleteButton(viewSection: ViewMotionCommentSection): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this comment field?');
        const content = viewSection.name;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(viewSection).catch(this.raiseError);
        }
    }
}
