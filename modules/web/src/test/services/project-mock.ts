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
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: ProjectService, useClass: ProjectMockService}
 *   ]
 * });
 * const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
 * fixture.detectChanges();
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

  /**
   * Creates a new project.
   *
   * Mock always returns a single fake project. Ignore input parameters.
   * Test project creation flow without real API validation.
   *
   * @param {ProjectModel} _model - Project creation model (ignored)
   * @returns {Observable<Project>} Observable emitting created fake project
   *
   * @example
   * ```typescript
   * projectMock.create(projectModel).subscribe(newProject => {
   *   expect(newProject.id).toBeTruthy();
   *   expect(newProject.name).toBeTruthy();
   * });
   * ```
   */
  create(_model: ProjectModel): Observable<Project> {
    return of(fakeProject());
  }

  /**
   * Gets the currently selected project.
   *
   * Mock returns single fake project. Override in custom mocks to
   * test different selected project scenarios.
   *
   * @returns {Observable<Project>} Observable emitting selected project
   *
   * @example
   * ```typescript
   * projectMock.selectedProject.subscribe(project => {
   *   expect(project.id).toBe(component.selectedProjectId);
   * });
   * ```
   */
  get selectedProject(): Observable<Project> {
    return of(fakeProject());
  }

  /**
   * Lists all available projects.
   *
   * Mock returns array of 2 fake projects by default.
   * Override in custom mocks to test scenarios with different project counts.
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
   */
  get projects(): Observable<Project[]> {
    return of(fakeProjects());
  }

  /**
   * Deletes a project by ID.
   *
   * Mock always returns null to indicate successful deletion.
   * Useful for testing project deletion flows and cleanup.
   *
   * @param {string} _projectID - Project ID to delete (ignored)
   * @returns {Observable<Project>} Observable emitting null on success
   *
   * @example
   * ```typescript
   * projectMock.delete('project-1').subscribe(() => {
   *   expect(component.projects.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  delete(_projectID: string): Observable<Project> {
    return of(null);
  }

  /**
   * Gets all available projects (including archived).
   *
   * Mock returns array of 2 fake projects. Similar to projects property
   * but may include archived projects in real service.
   *
   * @returns {Observable<Project[]>} Observable emitting all projects
   *
   * @example
   * ```typescript
   * projectMock.allProjects.subscribe(allProjects => {
   *   expect(allProjects.length).toBeGreaterThan(0);
   * });
   * ```
   */
  get allProjects() {
    return of(fakeProjects());
  }

  /**
   * Searches projects by name or ID (case-insensitive).
   *
   * Filters fake projects list by checking if name or ID contains query string.
   * Useful for testing search functionality and filtering behavior.
   *
   * @param {string} query - Search string to match against name/ID
   * @param {boolean} _displayAll - Whether to display archived (ignored)
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
   */
  searchProjects(query: string, _displayAll: boolean): Observable<Project[]> {
    const normalized = query.toLowerCase();
    return of(
      fakeProjects().filter(
        project => project.name.toLowerCase().includes(normalized) || project.id.toLowerCase().includes(normalized)
      )
    );
  }
}
