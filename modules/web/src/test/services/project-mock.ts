// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {Project, ProjectModel} from '@shared/entity/project';
import {fakeProject, fakeProjects} from '../data/project';

/**
 * Mock implementation of ProjectService for testing project management features.
 *
 * Provides project CRUD operations, listing, and search functionality without
 * real API calls. Emits events for project selection and list updates.
 *
 * **Advanced Testing Features:**
 * - Custom project data: Override projects list for different test scenarios
 * - Call tracking: Track how many times each method was called and with what arguments
 * - Event simulation: Manually emit project changes and updates
 * - Error simulation: Configure operations to return errors for error handling tests
 *
 * @example
 * ```typescript
 * // Basic usage
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: ProjectService, useClass: ProjectMockService}
 *   ]
 * });
 * const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
 * fixture.detectChanges();
 * ```
 *
 * @example
 * ```typescript
 * // Custom projects and call tracking
 * const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
 * projectMock.setCustomProjects([createProject('proj-1'), createProject('proj-2')]);
 * projectMock.projects.subscribe(projects => {
 *   expect(projects.length).toBe(2);
 * });
 * expect(projectMock.projectsCallCount).toBe(1);
 * ```
 *
 * @example
 * ```typescript
 * // Simulate project deletion error
 * const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
 * projectMock.setDeleteError(true, 'Cannot delete project with active clusters');
 * projectMock.delete('proj-1').subscribe(
 *   () => { // Should not reach },
 *   error => expect(error.message).toContain('Cannot delete')
 * );
 * ```
 *
 * @see {@link ProjectService} - Real project service implementation
 * @see {@link test/data/project} - Source of fakeProject() and fakeProjects()
 */
@Injectable()
export class ProjectMockService {
  /**
   * Event emitted when project selection changes.
   *
   * Emit this EventEmitter in tests to simulate project selection:
   * ```typescript
   * projectMock.onProjectChange.emit(fakeProject());
   * ```
   *
   * @type {EventEmitter<Project>}
   *
   * @example
   * ```typescript
   * it('should handle project selection', () => {
   *   spyOn(projectMock.onProjectChange, 'emit');
   *   projectMock.onProjectChange.emit(fakeProject());
   *   expect(projectMock.onProjectChange.emit).toHaveBeenCalled();
   * });
   * ```
   */
  onProjectChange = new EventEmitter<Project>();

  /**
   * Subject emitted when project list is updated.
   *
   * Emit to trigger project list refresh in components:
   * ```typescript
   * projectMock.onProjectsUpdate.next();
   * ```
   *
   * @type {Subject<void>}
   *
   * @example
   * ```typescript
   * it('should refresh on projects update', fakeAsync(() => {
   *   projectMock.onProjectsUpdate.next();
   *   tick();
   *   expect(component.isRefreshing).toBe(false);
   * }));
   * ```
   */
  onProjectsUpdate = new Subject<void>();

  // ===== Private Tracking & State Fields =====

  /** @private Tracks how many times projects getter was accessed */
  private _projectsCallCount = 0;

  /** @private Tracks how many times selectedProject getter was accessed */
  private _selectedProjectCallCount = 0;

  /** @private Tracks how many times allProjects getter was accessed */
  private _allProjectsCallCount = 0;

  /** @private Tracks how many times create() was called */
  private _createCallCount = 0;

  /** @private Stores arguments passed to create() method */
  private _createCallArguments: Array<{model: ProjectModel; timestamp: Date}> = [];

  /** @private Tracks how many times delete() was called */
  private _deleteCallCount = 0;

  /** @private Stores project IDs passed to delete() method */
  private _deleteCallArguments: Array<{projectID: string; timestamp: Date}> = [];

  /** @private Tracks how many times searchProjects() was called */
  private _searchProjectsCallCount = 0;

  /** @private Stores search arguments */
  private _searchProjectsCallArguments: Array<{query: string; displayAll: boolean; timestamp: Date}> = [];

  /** @private Custom projects list override */
  private _customProjectsList: Project[] | null = null;

  /** @private Flag to simulate create error */
  private _createShouldError = false;

  /** @private Error message for create failure */
  private _createErrorMessage = 'Failed to create project';

  /** @private Flag to simulate delete error */
  private _deleteShouldError = false;

  /** @private Error message for delete failure */
  private _deleteErrorMessage = 'Failed to delete project';

  /**
   * Creates a new project.
   *
   * Mock returns a single fake project by default. Use setCreateError()
   * to simulate creation failures. Automatically tracks call count and arguments.
   *
   * @param {ProjectModel} model - Project creation model
   * @returns {Observable<Project>} Observable emitting created fake project, or error if configured
   *
   * @example
   * ```typescript
   * projectMock.create(projectModel).subscribe(newProject => {
   *   expect(newProject.id).toBeTruthy();
   *   expect(newProject.name).toBeTruthy();
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Simulate creation error
   * projectMock.setCreateError(true, 'Project name already exists');
   * projectMock.create(projectModel).subscribe(
   *   () => { // Should not reach },
   *   error => expect(error.message).toContain('already exists')
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Track create calls
   * projectMock.create(projectModel);
   * expect(projectMock.createCallCount).toBe(1);
   * expect(projectMock.createCallArguments[0].model).toEqual(projectModel);
   * ```
   */
  create(model: ProjectModel): Observable<Project> {
    this._createCallCount++;
    this._createCallArguments.push({model, timestamp: new Date()});

    if (this._createShouldError) {
      return new Observable(subscriber => {
        subscriber.error(new Error(this._createErrorMessage));
      });
    }
    return of(fakeProject());
  }

  /**
   * Gets the currently selected project.
   *
   * Mock returns single fake project by default. Use setCustomProjects()
   * to override with different projects. Automatically tracks access count.
   *
   * @returns {Observable<Project>} Observable emitting selected project
   *
   * @example
   * ```typescript
   * projectMock.selectedProject.subscribe(project => {
   *   expect(project.id).toBe(component.selectedProjectId);
   * });
   * expect(projectMock.selectedProjectCallCount).toBe(1);
   * ```
   */
  get selectedProject(): Observable<Project> {
    this._selectedProjectCallCount++;
    const projects = this._customProjectsList ?? fakeProjects();
    return of(projects.length > 0 ? projects[0] : fakeProject());
  }

  /**
   * Lists all available projects.
   *
   * Mock returns array of 2 fake projects by default. Use setCustomProjects()
   * to provide different project lists for testing scenarios with varying project counts.
   * Automatically tracks access count.
   *
   * @returns {Observable<Project[]>} Observable emitting project array
   *
   * @example
   * ```typescript
   * projectMock.projects.subscribe(projects => {
   *   expect(projects.length).toBe(2);
   *   expect(projects[0].name).toBeTruthy();
   * });
   * ```
   *
   * @example
   * ```typescript
   * // With custom projects
   * const customProjects = [createProject('proj-1'), createProject('proj-2'), createProject('proj-3')];
   * projectMock.setCustomProjects(customProjects);
   * projectMock.projects.subscribe(projects => {
   *   expect(projects.length).toBe(3);
   * });
   * ```
   */
  get projects(): Observable<Project[]> {
    this._projectsCallCount++;
    return of(this._customProjectsList ?? fakeProjects());
  }

  /**
   * Deletes a project by ID.
   *
   * Mock returns null to indicate successful deletion by default.
   * Use setDeleteError() to simulate deletion failures.
   * Automatically tracks call count and deleted project IDs.
   *
   * @param {string} projectID - Project ID to delete
   * @returns {Observable<Project>} Observable emitting null on success, or error if configured
   *
   * @example
   * ```typescript
   * projectMock.delete('project-1').subscribe(() => {
   *   expect(component.projects.length).toBeLessThan(previousCount);
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Simulate deletion error
   * projectMock.setDeleteError(true, 'Cannot delete: project has active clusters');
   * projectMock.delete('project-1').subscribe(
   *   () => { // Should not reach },
   *   error => expect(error.message).toContain('active clusters')
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Track delete calls
   * projectMock.delete('project-1');
   * projectMock.delete('project-2');
   * expect(projectMock.deleteCallCount).toBe(2);
   * expect(projectMock.deleteCallArguments[0].projectID).toBe('project-1');
   * ```
   */
  delete(projectID: string): Observable<Project> {
    this._deleteCallCount++;
    this._deleteCallArguments.push({projectID, timestamp: new Date()});

    if (this._deleteShouldError) {
      return new Observable(subscriber => {
        subscriber.error(new Error(this._deleteErrorMessage));
      });
    }
    return of(null);
  }

  /**
   * Gets all available projects (including archived).
   *
   * Mock returns array of 2 fake projects by default. Similar to projects property
   * but may include archived projects in real service. Use setCustomProjects() to override.
   * Automatically tracks access count.
   *
   * @returns {Observable<Project[]>} Observable emitting all projects
   *
   * @example
   * ```typescript
   * projectMock.allProjects.subscribe(allProjects => {
   *   expect(allProjects.length).toBeGreaterThan(0);
   * });
   * expect(projectMock.allProjectsCallCount).toBe(1);
   * ```
   */
  get allProjects() {
    this._allProjectsCallCount++;
    return of(this._customProjectsList ?? fakeProjects());
  }

  /**
   * Searches projects by name or ID (case-insensitive).
   *
   * Filters projects list (custom or default) by checking if name or ID contains query string.
   * Useful for testing search functionality and filtering behavior.
   * Automatically tracks call count and search arguments.
   *
   * @param {string} query - Search string to match against name/ID
   * @param {boolean} displayAll - Whether to display archived
   * @returns {Observable<Project[]>} Observable emitting filtered projects
   *
   * @example
   * ```typescript
   * projectMock.searchProjects('test', false).subscribe(results => {
   *   results.forEach(project => {
   *     const match = project.name.toLowerCase() + project.id.toLowerCase();
   *     expect(match).toContain('test');
   *   });
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Track search calls
   * projectMock.searchProjects('prod', true);
   * projectMock.searchProjects('dev', false);
   * expect(projectMock.searchProjectsCallCount).toBe(2);
   * expect(projectMock.searchProjectsCallArguments[0].query).toBe('prod');
   * ```
   */
  searchProjects(query: string, displayAll: boolean): Observable<Project[]> {
    this._searchProjectsCallCount++;
    this._searchProjectsCallArguments.push({query, displayAll, timestamp: new Date()});

    const normalized = query.toLowerCase();
    const projectsList = this._customProjectsList ?? fakeProjects();
    return of(
      projectsList.filter(
        project => project.name.toLowerCase().includes(normalized) || project.id.toLowerCase().includes(normalized)
      )
    );
  }

  // ===== Call Tracking Properties =====

  /**
   * Gets the number of times the projects getter was accessed.
   *
   * @returns {number} Count of projects getter accesses
   */
  get projectsCallCount(): number {
    return this._projectsCallCount;
  }

  /**
   * Gets the number of times the selectedProject getter was accessed.
   *
   * @returns {number} Count of selectedProject getter accesses
   */
  get selectedProjectCallCount(): number {
    return this._selectedProjectCallCount;
  }

  /**
   * Gets the number of times the allProjects getter was accessed.
   *
   * @returns {number} Count of allProjects getter accesses
   */
  get allProjectsCallCount(): number {
    return this._allProjectsCallCount;
  }

  /**
   * Gets the number of times create() was called.
   *
   * @returns {number} Count of create() calls
   */
  get createCallCount(): number {
    return this._createCallCount;
  }

  /**
   * Gets the arguments passed to create() calls.
   *
   * Each entry includes the ProjectModel passed and the timestamp.
   *
   * @returns {Array} Array of create call records
   *
   * @example
   * ```typescript
   * projectMock.create(model1);
   * projectMock.create(model2);
   * const args = projectMock.createCallArguments;
   * expect(args.length).toBe(2);
   * expect(args[0].model).toEqual(model1);
   * ```
   */
  get createCallArguments(): typeof this._createCallArguments {
    return this._createCallArguments;
  }

  /**
   * Gets the number of times delete() was called.
   *
   * @returns {number} Count of delete() calls
   */
  get deleteCallCount(): number {
    return this._deleteCallCount;
  }

  /**
   * Gets the project IDs that were passed to delete() calls.
   *
   * Each entry includes the projectID and timestamp.
   *
   * @returns {Array} Array of delete call records
   *
   * @example
   * ```typescript
   * projectMock.delete('proj-1');
   * projectMock.delete('proj-2');
   * const args = projectMock.deleteCallArguments;
   * expect(args.length).toBe(2);
   * expect(args[0].projectID).toBe('proj-1');
   * ```
   */
  get deleteCallArguments(): typeof this._deleteCallArguments {
    return this._deleteCallArguments;
  }

  /**
   * Gets the number of times searchProjects() was called.
   *
   * @returns {number} Count of searchProjects() calls
   */
  get searchProjectsCallCount(): number {
    return this._searchProjectsCallCount;
  }

  /**
   * Gets the search arguments that were passed to searchProjects() calls.
   *
   * Each entry includes query, displayAll flag, and timestamp.
   *
   * @returns {Array} Array of search call records
   *
   * @example
   * ```typescript
   * projectMock.searchProjects('prod', true);
   * projectMock.searchProjects('dev', false);
   * const args = projectMock.searchProjectsCallArguments;
   * expect(args.length).toBe(2);
   * expect(args[0].query).toBe('prod');
   * ```
   */
  get searchProjectsCallArguments(): typeof this._searchProjectsCallArguments {
    return this._searchProjectsCallArguments;
  }

  // ===== Configuration Methods =====

  /**
   * Sets a custom projects list to be returned by projects, selectedProject, and allProjects.
   *
   * Useful for testing with different project counts, specific project names,
   * or different project configurations.
   *
   * @param {Project[]} projects - Custom projects array
   *
   * @example
   * ```typescript
   * const customProjects = [
   *   createProject('prod'),
   *   createProject('staging'),
   *   createProject('dev')
   * ];
   * projectMock.setCustomProjects(customProjects);
   * projectMock.projects.subscribe(projects => {
   *   expect(projects.length).toBe(3);
   * });
   * ```
   */
  setCustomProjects(projects: Project[]): void {
    this._customProjectsList = projects;
  }

  /**
   * Clears the custom projects override, reverting to default fake projects.
   *
   * @example
   * ```typescript
   * projectMock.setCustomProjects([...]);
   * projectMock.clearCustomProjects();
   * projectMock.projects.subscribe(projects => {
   *   expect(projects).toEqual(fakeProjects());
   * });
   * ```
   */
  clearCustomProjects(): void {
    this._customProjectsList = null;
  }

  /**
   * Configures create() to return an error instead of success.
   *
   * Useful for testing error handling in project creation flows,
   * such as validation errors, permission errors, or name conflicts.
   *
   * @param {boolean} shouldError - True to make create fail, false for success
   * @param {string} errorMessage - Error message to emit on creation failure
   *
   * @example
   * ```typescript
   * projectMock.setCreateError(true, 'Project name already exists');
   * projectMock.create(model).subscribe(
   *   () => { // Should not reach },
   *   error => expect(error.message).toContain('already exists')
   * );
   * ```
   */
  setCreateError(shouldError: boolean, errorMessage: string = 'Failed to create project'): void {
    this._createShouldError = shouldError;
    this._createErrorMessage = errorMessage;
  }

  /**
   * Configures delete() to return an error instead of success.
   *
   * Useful for testing error handling in project deletion flows,
   * such as permission errors or projects with active resources.
   *
   * @param {boolean} shouldError - True to make delete fail, false for success
   * @param {string} errorMessage - Error message to emit on deletion failure
   *
   * @example
   * ```typescript
   * projectMock.setDeleteError(true, 'Cannot delete project with active clusters');
   * projectMock.delete('proj-1').subscribe(
   *   () => { // Should not reach },
   *   error => expect(error.message).toContain('active clusters')
   * );
   * ```
   */
  setDeleteError(shouldError: boolean, errorMessage: string = 'Failed to delete project'): void {
    this._deleteShouldError = shouldError;
    this._deleteErrorMessage = errorMessage;
  }

  /**
   * Resets all call tracking counters and arguments.
   *
   * Useful in beforeEach() hooks or between different test phases.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   projectMock.resetCallTracking();
   *   expect(projectMock.createCallCount).toBe(0);
   * });
   * ```
   */
  resetCallTracking(): void {
    this._projectsCallCount = 0;
    this._selectedProjectCallCount = 0;
    this._allProjectsCallCount = 0;
    this._createCallCount = 0;
    this._deleteCallCount = 0;
    this._searchProjectsCallCount = 0;
    this._createCallArguments = [];
    this._deleteCallArguments = [];
    this._searchProjectsCallArguments = [];
  }

  /**
   * Resets all custom overrides, error configurations, and call tracking.
   *
   * Resets the mock to its default state.
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   projectMock.resetAll();
   * });
   * ```
   */
  resetAll(): void {
    this._customProjectsList = null;
    this._createShouldError = false;
    this._deleteShouldError = false;
    this.resetCallTracking();
  }
}
