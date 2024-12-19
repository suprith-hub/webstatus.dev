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

import {consume} from '@lit/context';
import {Task} from '@lit/task';
import {
  LitElement,
  type TemplateResult,
  html,
  CSSResultGroup,
  css,
  nothing,
} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {SHARED_STYLES} from '../css/shared-css.js';
import {SlMenu, SlMenuItem} from '@shoelace-style/shoelace/dist/shoelace.js';

import {
  ALL_BROWSERS,
  BROWSER_ID_TO_COLOR,
  type APIClient,
  type BrowsersParameter,
  type BrowserReleaseFeatureMetric,
} from '../api/client.js';
import {apiClientContext} from '../contexts/api-client-context.js';
import {getFeaturesLaggingFlag} from '../utils/urls.js';

import './webstatus-gchart';
import {WebStatusDataObj} from './webstatus-gchart.js';

/** Generate a key for globalFeatureSupport and missingOneImplementationMap. */
function statsDataKey(browser: BrowsersParameter): string {
  return browser;
}

@customElement('webstatus-stats-page')
export class StatsPage extends LitElement {
  @state()
  _loadingGFSTask: Task;

  @consume({context: apiClientContext})
  apiClient!: APIClient;

  @state()
  supportedBrowsers: BrowsersParameter[] = ALL_BROWSERS;

  @state()
  // Default: Date.now() - 1 year.
  startDate: Date = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  @state()
  endDate: Date = new Date(); // Today

  // Map from browser-channel to global feature support.
  // The key is generated by statsDataKey().
  @state()
  globalFeatureSupport = new Map<string, Array<BrowserReleaseFeatureMetric>>();

  @state()
  globalFeatureSupportChartOptions = {};

  @state()
  globalFeatureSupportChartDataObj: WebStatusDataObj | undefined;

  @state()
  missingOneImplementationMap = new Map<
    string,
    Array<BrowserReleaseFeatureMetric>
  >();

  @state()
  missingOneImplementationChartDataObj: WebStatusDataObj | undefined;

  static get styles(): CSSResultGroup {
    return [
      SHARED_STYLES,
      css`
        .hbox,
        .vbox {
          gap: var(--content-padding-large);
        }

        .under-construction {
          min-height: 12em;
        }

        /*  Make the dropdown menu button icon rotate when the menu is open,
            so it looks like sl-select. */
        sl-dropdown > sl-button > sl-icon {
          rotate: 0deg;
          transition: var(--sl-transition-medium) rotate ease;
        }
        sl-dropdown[open] > sl-button > sl-icon {
          rotate: -180deg;
          transition: var(--sl-transition-medium) rotate ease;
        }
      `,
    ];
  }

  handleBrowserSelection(event: Event) {
    const menu = event.target as SlMenu;
    const menuItemsArray: Array<SlMenuItem> = Array.from(menu.children).filter(
      child => child instanceof SlMenuItem,
    ) as Array<SlMenuItem>;

    // Build the list of values of checked menu-items.
    this.supportedBrowsers = menuItemsArray
      .filter(menuItem => menuItem.checked)
      .map(menuItem => menuItem.value) as BrowsersParameter[];
    // Regenerate data and redraw.  We should instead just filter it.
  }

  handleStartDateChange(event: Event) {
    const currentStartDate = this.startDate;
    this.startDate = new Date((event.target as HTMLInputElement).value);
    if (this.startDate.getTime() === currentStartDate.getTime()) return;
  }

  handleEndDateChange(event: Event) {
    const currentEndDate = this.endDate;
    this.endDate = new Date((event.target as HTMLInputElement).value);
    if (this.endDate.getTime() === currentEndDate.getTime()) return;
  }

  globalFeatureSupportResizeObserver: ResizeObserver | null = null;

  missingOneImplementationResizeObserver: ResizeObserver | null = null;

  setupResizeObserver() {
    // Set up ResizeObserver one time to redraw chart when container resizes.
    if (!this.globalFeatureSupportResizeObserver) {
      const gfsChartElement = this.shadowRoot!.getElementById(
        'global-feature-support-chart',
      );
      if (!gfsChartElement) return;
      this.globalFeatureSupportResizeObserver = new ResizeObserver(() => {
        // TODO: trigger update based on resize.
      });
      this.globalFeatureSupportResizeObserver.observe(gfsChartElement);
    }

    if (!this.missingOneImplementationResizeObserver) {
      const gfsChartElement = this.shadowRoot!.getElementById(
        'missing-one-implementation-chart',
      );
      if (!gfsChartElement) return;
      this.missingOneImplementationResizeObserver = new ResizeObserver(() => {
        // TODO: trigger update based on resize.
      });
      this.missingOneImplementationResizeObserver.observe(gfsChartElement);
    }
  }

  async _fetchGlobalFeatureSupportData(
    apiClient: APIClient,
    startDate: Date,
    endDate: Date,
  ) {
    if (typeof apiClient !== 'object') return;
    const promises = ALL_BROWSERS.map(async browser => {
      for await (const page of apiClient.getFeatureCountsForBrowser(
        browser,
        startDate,
        endDate,
      )) {
        // Append the new data to existing data
        const existingData =
          this.globalFeatureSupport.get(statsDataKey(browser)) || [];
        this.globalFeatureSupport.set(statsDataKey(browser), [
          ...existingData,
          ...page,
        ]);
      }
      this.globalFeatureSupportChartDataObj = this.createDisplayDataFromMap(
        this.globalFeatureSupport,
        true,
      );
    });
    await Promise.all(promises); // Wait for all browsers to finish
  }

  // TODO: Finish this method with real data.
  async _fetchMissingOneImplemenationCounts() {
    const browserReleaseFeatureMetric: BrowserReleaseFeatureMetric = {
      count: 8,
      timestamp: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const browserReleaseFeatureMetric1: BrowserReleaseFeatureMetric = {
      count: 5,
      timestamp: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    };
    let count: number = 0;
    ALL_BROWSERS.map(browser => {
      browserReleaseFeatureMetric.count = 8 + count;
      browserReleaseFeatureMetric1.count = 5 + count;
      count++;
      this.missingOneImplementationMap.set(statsDataKey(browser), [
        {...browserReleaseFeatureMetric},
        {...browserReleaseFeatureMetric1},
      ]);
    });
    this.missingOneImplementationChartDataObj = this.createDisplayDataFromMap(
      this.missingOneImplementationMap,
      false,
    );
  }

  constructor() {
    super();

    this._loadingGFSTask = new Task(this, {
      args: () =>
        [this.apiClient, this.startDate, this.endDate] as [
          APIClient,
          Date,
          Date,
        ],
      task: async ([apiClient, startDate, endDate]: [
        APIClient,
        Date,
        Date,
      ]) => {
        await this._fetchGlobalFeatureSupportData(
          apiClient,
          startDate,
          endDate,
        );
        await this._fetchMissingOneImplemenationCounts();
        return this.globalFeatureSupport;
      },
    });
  }

  // Make a DataTable from the target data map.
  // TODO(kyleju): refactor this method acorss feature detail page
  // and stats page, https://github.com/GoogleChrome/webstatus.dev/issues/964.
  createDisplayDataFromMap(
    targetMap: Map<string, Array<BrowserReleaseFeatureMetric>>,
    addMax: boolean,
  ): WebStatusDataObj {
    // Get the list of supported browsers.
    const browsers = this.supportedBrowsers;

    const dataObj: WebStatusDataObj = {cols: [], rows: []};
    dataObj.cols.push({type: 'date', label: 'Date', role: 'domain'});
    for (const browser of browsers) {
      dataObj.cols.push({type: 'number', label: browser, role: 'data'});
    }
    if (addMax) {
      dataObj.cols.push({type: 'number', label: 'Max features', role: 'data'});
    }

    // Map from date to an object with counts for each browser
    const dateToBrowserDataMap = new Map<number, {[key: string]: number}>();

    // Merge data across all browsers into one array of rows.
    for (const browser of browsers) {
      const data = targetMap.get(statsDataKey(browser));
      if (!data) continue;
      for (const row of data) {
        if (!row) continue;
        const dateSeconds = new Date(row.timestamp).getTime();
        const featureCount = row.count!;
        if (!dateToBrowserDataMap.has(dateSeconds)) {
          dateToBrowserDataMap.set(dateSeconds, {});
        }
        const browserCounts = dateToBrowserDataMap.get(dateSeconds)!;
        browserCounts[browser] = featureCount;
      }
    }
    // Create array of dateToBrowserDataMap entries and sort by dateSeconds
    const data = Array.from(dateToBrowserDataMap.entries()).sort(
      ([d1], [d2]) => d1 - d2,
    );

    // For each date, add a row to the dataTable
    for (const datum of data) {
      const dateSeconds = datum[0];
      const date = new Date(dateSeconds);
      const browserCounts = datum[1];
      // Make an array of browser counts, in the order of browsers.
      // If the browser is not in the browserCounts, add null.
      const browserCountArray = browsers.map(
        browser => browserCounts[browser] || null,
      );

      if (addMax) {
        let maxCount = 0;
        for (const count of browserCountArray) {
          if (count) {
            maxCount = Math.max(maxCount, count);
          }
        }
        dataObj.rows.push([date, ...browserCountArray, maxCount]);
      } else {
        dataObj.rows.push([date, ...browserCountArray]);
      }
    }
    return dataObj;
  }

  generatedisplayDataChartOptions(
    vAxisTitle: string,
  ): google.visualization.LineChartOptions {
    // Compute seriesColors from selected browsers and BROWSER_ID_TO_COLOR
    const selectedBrowsers = this.supportedBrowsers;
    const seriesColors = [...selectedBrowsers, 'total'].map(browser => {
      const browserKey = browser as keyof typeof BROWSER_ID_TO_COLOR;
      return BROWSER_ID_TO_COLOR[browserKey];
    });

    // Add one day to this.endDate.
    const endDate = new Date(this.endDate.getTime() + 1000 * 60 * 60 * 24);
    const options = {
      height: 300, // This is necessary to avoid shrinking to 0 or 18px.
      hAxis: {
        title: '',
        titleTextStyle: {color: '#333'},
        viewWindow: {min: this.startDate, max: endDate},
      },
      vAxis: {
        minValue: 0,
        title: vAxisTitle,
        format: '#,###',
      },
      legend: {position: 'top'},
      colors: seriesColors,
      chartArea: {left: 100, right: 16, top: 40, bottom: 40},

      interpolateNulls: true,

      // Multiple selection of points will be summarized in one tooltip.
      tooltip: {trigger: 'selection'},
      selectionMode: 'multiple',
      aggregationTarget: 'category',

      // Enable explorer mode
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 4,
        maxZoomOut: 4,
        zoomDelta: 0.01,
      },
    } as google.visualization.LineChartOptions;

    this.globalFeatureSupportChartOptions = options;
    return options;
  }

  renderTitleAndControls(): TemplateResult {
    return html`
      <div id="titleAndControls" class="hbox">
        <h1>Statistics</h1>
        <div class="spacer"></div>
        <div class="hbox wrap valign-items-center">
          <sl-checkbox>Show browser versions</sl-checkbox>
          <label
            >Start date
            <sl-input
              id="start-date"
              @sl-change=${this.handleStartDateChange}
              type="date"
              .valueAsDate="${this.startDate}"
            ></sl-input>
          </label>
          <label
            >End date
            <sl-input
              id="end-date"
              @sl-change=${this.handleEndDateChange}
              type="date"
              .valueAsDate="${this.endDate}"
            ></sl-input>
          </label>
          <sl-radio-group value="WPT">
            <sl-radio-button value="WPT">WPT</sl-radio-button>
            <sl-radio-button value="BCD" disabled>BCD</sl-radio-button>
          </sl-radio-group>
        </div>
      </div>
    `;
  }

  renderGlobalFeatureSupportChartWhenComplete(): TemplateResult {
    return html`
      <webstatus-gchart
        id="global-feature-support-chart"
        .hasMax=${true}
        .containerId="${'global-feature-support-chart-container'}"
        .chartType="${'LineChart'}"
        .dataObj="${this.globalFeatureSupportChartDataObj}"
        .options="${this.generatedisplayDataChartOptions(
          'Number of features supported',
        )}"
      >
        Loading chart...
      </webstatus-gchart>
    `;
  }

  renderGlobalFeatureSupportChart(): TemplateResult | undefined {
    return this._loadingGFSTask.render({
      complete: () => this.renderGlobalFeatureSupportChartWhenComplete(),
      error: () => this.renderChartWhenError(),
      initial: () => this.renderChartWhenInitial(),
      pending: () => this.renderChartWhenPending(),
    });
  }

  renderMissingOneImplementationChartWhenComplete(): TemplateResult {
    return html`
      <webstatus-gchart
        id="missing-one-implementation-chart"
        .hasMax=${false}
        .containerId="${'missing-one-implementation-chart-container'}"
        .chartType="${'LineChart'}"
        .dataObj="${this.missingOneImplementationChartDataObj}"
        .options="${this.generatedisplayDataChartOptions(
          'Number of features missing',
        )}"
      >
        Loading chart...
      </webstatus-gchart>
    `;
  }

  renderMissingOneImplementationChart(): TemplateResult | undefined {
    return this._loadingGFSTask.render({
      complete: () => this.renderMissingOneImplementationChartWhenComplete(),
      error: () => this.renderChartWhenError(),
      initial: () => this.renderChartWhenInitial(),
      pending: () => this.renderChartWhenPending(),
    });
  }

  renderGlobalFeatureSupport(): TemplateResult {
    return html`
      <sl-card id="global-feature-support">
        <div slot="header" class="hbox">
          Global feature support
          <div class="spacer"></div>
          <sl-select>
            <sl-option>All features</sl-option>
            <sl-option>how to select?</sl-option>
          </sl-select>
          <sl-dropdown
            id="global-feature-support-browser-selector"
            multiple
            stay-open-on-select
            .value="${this.supportedBrowsers.join(' ')}"
          >
            <sl-button slot="trigger">
              <sl-icon slot="suffix" name="chevron-down"></sl-icon>
              Browsers
            </sl-button>
            <sl-menu @sl-select=${this.handleBrowserSelection}>
              <sl-menu-item type="checkbox" value="chrome">Chrome</sl-menu-item>
              <sl-menu-item type="checkbox" value="edge">Edge</sl-menu-item>
              <sl-menu-item type="checkbox" value="firefox"
                >Firefox</sl-menu-item
              >
              <sl-menu-item type="checkbox" value="safari">Safari</sl-menu-item>
            </sl-menu>
          </sl-dropdown>
        </div>
        <div>${this.renderGlobalFeatureSupportChart()}</div>
      </sl-card>
    `;
  }

  renderFeaturesLagging(): TemplateResult {
    return html`
      <sl-card id="features-lagging">
        <div slot="header" class="hbox">
          Features missing in only 1 browser
          <div class="spacer"></div>
          <sl-select>
            <sl-option>All features</sl-option>
            <sl-option>how to select?</sl-option>
          </sl-select>
          <sl-dropdown multiple value="Chrome Edge Firefox Safari">
            <sl-option>Chrome</sl-option>
            <sl-option>Edge</sl-option>
            <sl-option>Firefox</sl-option>
            <sl-option>Safari</sl-option>
          </sl-dropdown>
        </div>
        <div>${this.renderMissingOneImplementationChart()}</div>
      </sl-card>
    `;
  }

  renderBaselineFeatures(): TemplateResult {
    return html`
      <sl-card
        class="halign-stretch"
        id="baseline-features"
        style="display:none"
      >
        <div slot="header">Baseline features</div>
        <p class="under-construction">Small chart goes here...</p>
      </sl-card>
    `;
  }

  renderTimeToAvailability(): TemplateResult {
    return html`
      <sl-card
        class="halign-stretch"
        id="time-to-availibility"
        style="display:none"
      >
        <div slot="header">Time to availablity</div>
        <p class="under-construction">Small chart goes here...</p>
      </sl-card>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="vbox">
        ${this.renderTitleAndControls()} ${this.renderGlobalFeatureSupport()}
        ${getFeaturesLaggingFlag(window.location)
          ? this.renderFeaturesLagging()
          : nothing}
        <div class="hbox">
          ${this.renderBaselineFeatures()} ${this.renderTimeToAvailability()}
        </div>
      </div>
    `;
  }

  renderChartWhenError(): TemplateResult {
    return html`Error when loading stats.`;
  }

  renderChartWhenInitial(): TemplateResult {
    return html`Preparing request for stats.`;
  }

  renderChartWhenPending(): TemplateResult {
    return html`Loading stats.`;
  }
}
