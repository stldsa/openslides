import { Injectable } from '@angular/core';

import { FilterListService, OsFilter, OsFilterOption } from '../../../core/services/filter-list.service';
import { Motion } from '../../../shared/models/motions/motion';
import { ViewMotion } from '../models/view-motion';
import { CategoryRepositoryService } from './category-repository.service';
import { WorkflowRepositoryService } from './workflow-repository.service';
import { StorageService } from '../../../core/services/storage.service';
import { MotionRepositoryService } from './motion-repository.service';
import { MotionBlockRepositoryService } from './motion-block-repository.service';
import { MotionCommentSectionRepositoryService } from './motion-comment-section-repository.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class MotionFilterListService extends FilterListService<Motion, ViewMotion> {
    protected name = 'Motion';

    /**
     * getter for the filterOptions. Note that in this case, the options are
     * generated dynamically, as the options change with the datastore
     */
    public get filterOptions(): OsFilter[] {
        return [
            this.flowFilterOptions,
            this.categoryFilterOptions,
            this.motionBlockFilterOptions,
            this.recommendationFilterOptions,
            this.motionCommentFilterOptions
        ].concat(this.staticFilterOptions);
    }

    /**
     * Filter definitions for the workflow filter. Options will be generated by
     * getFilterOptions (as the workflows available may change)
     */
    public flowFilterOptions: OsFilter = {
        property: 'state',
        label: 'State',
        options: []
    };

    /**
     * Filter definitions for the category filter. Options will be generated by
     * getFilterOptions (as the categories available may change)
     */
    public categoryFilterOptions: OsFilter = {
        property: 'category',
        options: []
    };

    public motionBlockFilterOptions: OsFilter = {
        property: 'motion_block_id',
        label: 'Motion block',
        options: []
    };

    public motionCommentFilterOptions: OsFilter = {
        property: 'commentSectionIds',
        label: 'Comment',
        options: []
    };

    public recommendationFilterOptions: OsFilter = {
        property: 'recommendation',
        label: 'Recommendation',
        options: []
    };

    public staticFilterOptions = [
        {
            property: 'star',
            label: this.translate.instant('Favorites'),
            isActive: false,
            options: [
                {
                    condition: true,
                    label: this.translate.instant('Is favorite')
                },
                {
                    condition: false,
                    label: this.translate.instant('Is not favorite')
                }
            ]
        },
        {
            property: 'hasNotes',
            label: this.translate.instant('Personal notes'),
            isActive: false,
            options: [
                {
                    condition: true,
                    label: this.translate.instant('Has notes')
                },
                {
                    condition: false,
                    label: this.translate.instant('Does not have notes')
                }
            ]
        }
    ];

    /**
     * Constructor. Subscribes to a variety of Repository to dynamically update
     * the available filters
     *
     * @param store The browser's storage; required for fetching filters from any previous sessions
     * @param workflowRepo Subscribing to filters by states/Recommendation
     * @param categoryRepo Subscribing to filters by Categories
     * @param motionBlockRepo Subscribing to filters by MotionBlock
     * @param commentRepo subycribing filter by presense of comment
     * @param translate Translation service
     * @param motionRepo the motion's own repository, required by the parent
     */
    public constructor(
        store: StorageService,
        private workflowRepo: WorkflowRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private commentRepo: MotionCommentSectionRepositoryService,
        private translate: TranslateService,
        motionRepo: MotionRepositoryService
    ) {
        super(store, motionRepo);
        this.subscribeWorkflows();
        this.subscribeCategories();
        this.subscribeMotionBlocks();
        this.subscribeComments();
    }

    // TODO: Notes/Favorite
    // does not work, some cloning error. I want to:
    //  'check all items in filterService against this function, in the
    //  scope of motion-filter.service'
    // public getNoteFilterFn(): Function {
    //     const notesRepo = this.notesRepo;
    //     return (m: ViewMotion) => {
    //         return notesRepo.hasPersonalNote('Motion', m.id)
    //     }
    // };

    /**
     * Subscibes to changing MotionBlocks, and updates the filter accordingly
     */
    private subscribeMotionBlocks(): void {
        this.motionBlockRepo.getViewModelListObservable().subscribe(motionBlocks => {
            const motionBlockOptions = [];
            motionBlocks.forEach(mb => {
                motionBlockOptions.push({
                    condition: mb.id,
                    label: mb.title,
                    isActive: false
                });
            });
            if (motionBlocks.length) {
                motionBlockOptions.push('-');
                motionBlockOptions.push({
                    condition: null,
                    label: 'No motion block set',
                    isActive: false
                });
            }
            this.motionBlockFilterOptions.options = motionBlockOptions;
            this.updateFilterDefinitions(this.filterOptions);
        });
    }

    /**
     * Subscibes to changing Categories, and updates the filter accordingly
     */
    private subscribeCategories(): void {
        this.categoryRepo.getViewModelListObservable().subscribe(categories => {
            const categoryOptions: (OsFilterOption | string)[] = [];
            categories.forEach(cat => {
                categoryOptions.push({
                    condition: cat.id,
                    label: cat.prefixedName,
                    isActive: false
                });
            });
            if (categories.length) {
                categoryOptions.push('-');
                categoryOptions.push({
                    label: 'No category set',
                    condition: null
                });
            }
            this.categoryFilterOptions.options = categoryOptions;
            this.updateFilterDefinitions(this.filterOptions);
        });
    }

    /**
     * Subscibes to changing Workflows, and updates the state and recommendation filters accordingly
     */
    private subscribeWorkflows(): void {
        this.workflowRepo.getViewModelListObservable().subscribe(workflows => {
            const workflowOptions: (OsFilterOption | string)[] = [];
            const finalStates: number[] = [];
            const nonFinalStates: number[] = [];
            const recommendationOptions: (OsFilterOption | string)[] = [];
            workflows.forEach(workflow => {
                workflowOptions.push(workflow.name);
                recommendationOptions.push(workflow.name);
                workflow.states.forEach(state => {
                    if (state.isFinalState) {
                        finalStates.push(state.id);
                    } else {
                        nonFinalStates.push(state.id);
                    }
                    workflowOptions.push({
                        condition: state.id,
                        label: state.name,
                        isActive: false
                    });
                    if (state.recommendation_label) {
                        recommendationOptions.push({
                            condition: state.id,
                            label: state.recommendation_label,
                            isActive: false
                        });
                    }
                });
            });
            if (workflowOptions.length) {
                workflowOptions.push('-');
                workflowOptions.push({
                    label: 'Done',
                    condition: finalStates
                });
                workflowOptions.push({
                    label: 'Undone',
                    condition: nonFinalStates
                });
            }
            if (recommendationOptions.length) {
                recommendationOptions.push('-');
                recommendationOptions.push({
                    label: 'No recommendation',
                    condition: null
                });
            }
            this.flowFilterOptions.options = workflowOptions;
            this.recommendationFilterOptions.options = recommendationOptions;
            this.updateFilterDefinitions(this.filterOptions);
        });
    }

    /**
     * Subscibes to changing Comments, and updates the filter accordingly
     */
    private subscribeComments(): void {
        this.commentRepo.getViewModelListObservable().subscribe(comments => {
            const commentOptions: (OsFilterOption | string)[] = [];
            comments.forEach(comm => {
                commentOptions.push({
                    condition: comm.id,
                    label: comm.name,
                    isActive: false
                });
            });
            if (comments.length) {
                commentOptions.push('-');
                commentOptions.push({
                    label: 'No comment',
                    condition: null
                });
            }
            this.motionCommentFilterOptions.options = commentOptions;
            this.updateFilterDefinitions(this.filterOptions);
        });
    }
}
