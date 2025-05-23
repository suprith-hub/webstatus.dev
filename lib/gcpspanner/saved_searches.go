// Copyright 2024 Google LLC
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

package gcpspanner

import (
	"time"
)

// SavedSearchScope represents the scope of a saved search.
type SavedSearchScope string

const (
	// UserPublicScope indicates that this is user created saved search meant to be publicly accessible.
	UserPublicScope SavedSearchScope = "USER_PUBLIC"
)

const savedSearchesTable = "SavedSearches"

// SavedSearch represents a saved search row in the SavedSearches table.
type SavedSearch struct {
	ID          string           `spanner:"ID"`
	Name        string           `spanner:"Name"`
	Description *string          `spanner:"Description"`
	Query       string           `spanner:"Query"`
	Scope       SavedSearchScope `spanner:"Scope"`
	AuthorID    string           `spanner:"AuthorID"`
	CreatedAt   time.Time        `spanner:"CreatedAt"`
	UpdatedAt   time.Time        `spanner:"UpdatedAt"`
}
