/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  LitElement,
  type TemplateResult,
  CSSResultGroup,
  css,
  html,
  nothing,
} from 'lit';
import {TaskStatus} from '@lit/task';
import {customElement, property, state} from 'lit/decorators.js';
import {type components} from 'webstatus.dev-backend';

import './webstatus-overview-filters.js';
import './webstatus-overview-table.js';
import './webstatus-overview-pagination.js';
import {SHARED_STYLES} from '../css/shared-css.js';
import {TaskTracker} from '../utils/task-tracker.js';
import {ApiError} from '../api/errors.js';
import {
  AppBookmarkInfo,
  appBookmarkInfoContext,
  getCurrentBookmark,
} from '../contexts/app-bookmark-info-context.js';
import {consume} from '@lit/context';

@customElement('webstatus-overview-content')
export class WebstatusOverviewContent extends LitElement {
  @property({type: Object})
  taskTracker: TaskTracker<components['schemas']['FeaturePage'], ApiError> = {
    status: TaskStatus.INITIAL, // Initial state
    error: null,
    data: null,
  };

  @property({type: Object})
  location!: {search: string}; // Set by parent.

  @consume({context: appBookmarkInfoContext, subscribe: true})
  @state()
  appBookmarkInfo?: AppBookmarkInfo;

  static get styles(): CSSResultGroup {
    return [
      SHARED_STYLES,
      css`
        .header-line {
          gap: 1em;
        }
        .stats-summary {
          color: var(--unimportant-text-color);
          margin-right: var(--content-padding);
        }
        .overview-description {
          color: var(--unimportant-text-color);
          margin-bottom: var(--content-padding);
        }
      `,
    ];
  }

  renderCount(): TemplateResult {
    switch (this.taskTracker.status) {
      case TaskStatus.INITIAL:
      case TaskStatus.PENDING:
        return html`Loading features...`;
      case TaskStatus.COMPLETE:
        return html`
          <span class="stats-summary">
            ${this.taskTracker.data?.metadata.total ?? 0} features
          </span>
        `;
      case TaskStatus.ERROR:
        return html`Failed to load features`;
    }
  }

  render(): TemplateResult {
    const bookmark = getCurrentBookmark(this.appBookmarkInfo, this.location);
    const pageTitle = bookmark ? bookmark.name : 'Features overview';
    const pageDescription = bookmark?.description;
    return html`
      <div class="main">
        <div class="hbox halign-items-space-between header-line">
          <h1 class="halign-stretch" id="overview-title">${pageTitle}</h1>
        </div>
        ${pageDescription
          ? html`<div class="hbox wrap" id="overview-description">
              <h3>${pageDescription}</h3>
            </div>`
          : nothing}
        <div class="hbox">${this.renderCount()}</div>
        <br />
        <webstatus-overview-filters
          .location=${this.location}
        ></webstatus-overview-filters>
        <br />

        <webstatus-overview-table
          .location=${this.location}
          .taskTracker=${this.taskTracker}
          .bookmark=${bookmark}
        >
        </webstatus-overview-table>
        <webstatus-overview-pagination
          .location=${this.location}
          .totalCount=${this.taskTracker.data?.metadata.total ?? 0}
        ></webstatus-overview-pagination>
      </div>
    `;
  }
}
