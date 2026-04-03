# Classification Mapping Update

## Changes Made

Updated the classification mapping in the CMS to EXACTLY match the website filter categories.

### Key Changes:

1. **Simplified to 2 Options Only**
   - Only TVC and narrative classifications (matching website filters)
   - Removed all other options (BRAND FILM, DOCUMENTARY, COMMERCIAL, etc.)

2. **TVC Classification**
   - Value: `'TVC'`
   - Display: "TVC / Brand Films"
   - Category: "Television Commercial"
   - `data_cat: 'TVC'`
   - Matches website filter: `<a data-cat="TVC">TVC / Brand Films</a>`

3. **Narrative Classification**
   - Value: `'narrative'` (lowercase)
   - Display: "Narrative Films"
   - Category: "Narrative Films"
   - `data_cat: 'narrative'`
   - Matches website filter: `<a data-cat="narrative">Narrative Films</a>`

## Updated Files:

- `final_cms/src/components/projects/ProjectForm.tsx`
- `final_cms/src/components/projects/BulkImport.tsx`

## Classification Options (Final):

| Classification | Display Text | Category | data_cat |
|---------------|--------------|----------|----------|
| TVC | TVC / Brand Films | Television Commercial | TVC |
| narrative | Narrative Films | Narrative Films | narrative |

## How It Works:

1. When you select a "Project Type" in the CMS dropdown:
   - **TVC / Brand Films** → Sets `classification: "TVC"`, `data_cat: "TVC"`
   - **Narrative Films** → Sets `classification: "narrative"`, `data_cat: "narrative"`

2. The website uses the `classification` field for filtering:
   - `<li data-cat="${project.classification}">`
   - Projects with `classification: "TVC"` match filter `data-cat="TVC"`
   - Projects with `classification: "narrative"` match filter `data-cat="narrative"`

3. Website filters (works.html):
   ```html
   <a data-cat="*">all</a>
   <a data-cat="TVC">TVC / Brand Films</a>
   <a data-cat="narrative">Narrative Films</a>
   ```

## Testing:

1. Go to CMS → Projects → Add New Project
2. Open "Project Type" dropdown
3. You should see only 2 options:
   - TVC / Brand Films
   - Narrative Films

4. Select "TVC / Brand Films"
5. Verify it sets:
   - Classification: TVC
   - Category: Television Commercial
   - data_cat: TVC

6. Select "Narrative Films"
7. Verify it sets:
   - Classification: narrative
   - Category: Narrative Films
   - data_cat: narrative

8. On the website works page, the filters will work perfectly:
   - Click "TVC / Brand Films" → Shows only projects with `classification: "TVC"`
   - Click "Narrative Films" → Shows only projects with `classification: "narrative"`
   - Click "all" → Shows all projects

## Perfect Match:

✅ CMS dropdown options = Website filter labels
✅ CMS classification values = Website data-cat values
✅ Filtering works seamlessly without any mapping needed
