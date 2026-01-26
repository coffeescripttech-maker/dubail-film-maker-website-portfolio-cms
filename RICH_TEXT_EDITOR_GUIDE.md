# Rich Text Editor Guide

## Overview
The About Settings now includes a rich text editor for Founder Bio and Company Description fields, making it easy to format text without manually typing HTML tags.

## Features

### 1. **Formatting Toolbar**
Quick-access buttons for common formatting:
- **B** - Bold text (`<strong>`)
- **I** - Italic text (`<em>`)
- **↵** - Line break (`<br />`)
- **¶** - Paragraph (`<p>`)
- **Auto BR** - Convert all line breaks to `<br />` tags

### 2. **Keyboard Shortcuts**
- `Ctrl+B` (or `Cmd+B` on Mac) - Bold
- `Ctrl+I` (or `Cmd+I` on Mac) - Italic
- `Ctrl+Enter` (or `Cmd+Enter` on Mac) - Line break

### 3. **Auto BR Feature**
Automatically converts regular line breaks (Enter key) into `<br />` tags with one click.

## How to Use

### Basic Formatting

#### Bold Text:
1. Select the text you want to make bold
2. Click the **B** button (or press `Ctrl+B`)
3. Result: `<strong>selected text</strong>`

#### Italic Text:
1. Select the text you want to italicize
2. Click the **I** button (or press `Ctrl+I`)
3. Result: `<em>selected text</em>`

#### Line Breaks:
**Option 1 - Manual:**
1. Place cursor where you want the break
2. Click the **↵** button (or press `Ctrl+Enter`)
3. Result: `<br />` inserted at cursor position

**Option 2 - Auto Convert:**
1. Type your text normally, pressing Enter for new lines
2. Click the **Auto BR** button
3. All line breaks automatically converted to `<br />`

### Example Workflow

#### Before (typing manually):
```
Emirati award-winning filmmaker.<br /><br />With a proven track record.<br /><br />As the Founder of DXP.
```

#### After (using Rich Text Editor):
```
Type naturally:
Emirati award-winning filmmaker.

With a proven track record.

As the Founder of DXP.

Then click "Auto BR" button → Done!
```

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ Founder Bio                                     │
├─────────────────────────────────────────────────┤
│ [B] [I] [↵] [¶]                    [Auto BR]   │ ← Toolbar
├─────────────────────────────────────────────────┤
│                                                 │
│  Text editing area...                           │ ← Editor
│  (monospace font for HTML visibility)           │
│                                                 │
├─────────────────────────────────────────────────┤
│ 💡 Tips:                                        │
│ • Select text and click buttons to format      │ ← Help
│ • Use Ctrl+B for bold, Ctrl+I for italic       │
│ • Click "↵" or Ctrl+Enter for line break       │
│ • Click "Auto BR" to convert line breaks       │
└─────────────────────────────────────────────────┘
```

## Features in Detail

### 1. Bold Formatting
**Button**: B
**Shortcut**: `Ctrl+B`
**HTML**: `<strong>text</strong>`

**Usage**:
- Select "award-winning filmmaker"
- Press `Ctrl+B`
- Result: `<strong>award-winning filmmaker</strong>`

### 2. Italic Formatting
**Button**: I
**Shortcut**: `Ctrl+I`
**HTML**: `<em>text</em>`

**Usage**:
- Select "DXP"
- Press `Ctrl+I`
- Result: `<em>DXP</em>`

### 3. Line Break
**Button**: ↵
**Shortcut**: `Ctrl+Enter`
**HTML**: `<br />`

**Usage**:
- Place cursor at end of line
- Click ↵ button
- Result: `<br />` inserted

### 4. Paragraph Wrap
**Button**: ¶
**HTML**: `<p>text</p>`

**Usage**:
- Select entire paragraph
- Click ¶ button
- Result: `<p>paragraph text</p>`

### 5. Auto BR Conversion
**Button**: Auto BR

**What it does**:
Converts this:
```
Line 1
Line 2
Line 3
```

To this:
```
Line 1<br />Line 2<br />Line 3
```

**Perfect for**:
- Pasting text from Word/Google Docs
- Converting existing content
- Quick formatting of multi-line text

## Tips & Best Practices

### 1. **Use Auto BR for Bulk Content**
If you have a lot of text with line breaks:
1. Paste or type it naturally
2. Click "Auto BR" once
3. All line breaks converted instantly

### 2. **Combine Formatting**
You can combine multiple formats:
```html
<strong><em>Bold and italic text</em></strong>
```

### 3. **Preview Your HTML**
The editor uses monospace font so you can see the HTML tags clearly as you type.

### 4. **Keyboard Shortcuts Save Time**
- `Ctrl+B` for bold
- `Ctrl+I` for italic
- `Ctrl+Enter` for line break

Much faster than clicking buttons!

### 5. **Double Line Breaks for Paragraphs**
For paragraph spacing:
```
Text line 1<br /><br />Text line 2
```
Creates visual paragraph separation.

## Common Scenarios

### Scenario 1: Formatting a Biography

**Input** (type naturally):
```
Ahmed Al Mutawa is an award-winning filmmaker.

He holds an MFA in Filmmaking from AAU.

As the Founder of DXP, he has led major projects.
```

**Steps**:
1. Click "Auto BR" button
2. Select "award-winning" → Press `Ctrl+B`
3. Select "DXP" → Press `Ctrl+I`

**Result**:
```html
Ahmed Al Mutawa is an <strong>award-winning</strong> filmmaker.<br /><br />He holds an MFA in Filmmaking from AAU.<br /><br />As the Founder of <em>DXP</em>, he has led major projects.
```

### Scenario 2: Adding Emphasis

**Before**:
```
DXP has been honored with accolades.
```

**Steps**:
1. Select "DXP"
2. Press `Ctrl+B`

**After**:
```html
<strong>DXP</strong> has been honored with accolades.
```

### Scenario 3: Converting Pasted Content

**Pasted from Word**:
```
Line 1
Line 2
Line 3
```

**Steps**:
1. Paste content
2. Click "Auto BR"

**Result**:
```html
Line 1<br />Line 2<br />Line 3
```

## Advantages Over Plain Textarea

### Before (Plain Textarea):
❌ Manual HTML typing: `text<br /><br />more text`
❌ Easy to make typos: `<br/>`, `<br>`, `<br />`
❌ Hard to see structure
❌ Slow and error-prone

### After (Rich Text Editor):
✅ Visual formatting buttons
✅ Keyboard shortcuts
✅ Auto BR conversion
✅ Consistent HTML output
✅ Faster and easier

## Technical Details

### HTML Tags Supported:
- `<strong>` - Bold text
- `<em>` - Italic text
- `<br />` - Line break (self-closing)
- `<p>` - Paragraph wrapper

### Tag Insertion Logic:
```typescript
// For wrapping tags (bold, italic, paragraph)
const openTag = `<${tag}>`;
const closeTag = `</${tag}>`;
newText = before + openTag + selected + closeTag + after;

// For self-closing tags (line break)
newText = before + '<br />' + after;
```

### Cursor Management:
After inserting tags, cursor automatically positions:
- **Wrapping tags**: After the closing tag
- **Line break**: After the `<br />` tag

## Accessibility

### Keyboard Navigation:
- All buttons accessible via Tab key
- Keyboard shortcuts for common actions
- Focus indicators visible

### Screen Reader Support:
- Button titles describe actions
- Semantic HTML structure
- Clear labels

## Browser Compatibility

Works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Issue: Auto BR not working
**Solution**: Make sure you have actual line breaks (press Enter) in your text

### Issue: Formatting not visible
**Solution**: The editor shows raw HTML - this is intentional for transparency

### Issue: Keyboard shortcuts not working
**Solution**: Make sure the textarea has focus (click inside it first)

### Issue: Tags appearing on website
**Solution**: This is correct - the portfolio website renders the HTML properly

## Future Enhancements

Potential improvements:
- Undo/Redo functionality
- Link insertion
- Heading tags (H1, H2, H3)
- Lists (ordered/unordered)
- Text alignment
- Color picker
- Image insertion
- Full WYSIWYG preview

## Related Files

- `src/components/common/RichTextEditor.tsx` - Editor component
- `src/components/settings/AboutSettings.tsx` - Implementation
- `ABOUT_VIDEO_UPLOAD_GUIDE.md` - Video upload guide
- `ABOUT_IMAGES_ADMIN_GUIDE.md` - Image management guide
