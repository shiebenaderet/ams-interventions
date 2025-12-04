# Quick Start Guide: AMS Interventions Website

## 🚀 Getting Your Website Live in 15 Minutes

### Option 1: GitHub Pages (Recommended - Free & Easy)

#### Step 1: Create a GitHub Account (if needed)
1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Follow the prompts

#### Step 2: Create a New Repository
1. Click the "+" in the top right corner
2. Select "New repository"
3. Name it: `ams-interventions`
4. Make it Public (required for free GitHub Pages)
5. Click "Create repository"

#### Step 3: Upload Your Files
1. On the new repository page, click "uploading an existing file"
2. Drag and drop ALL files and folders from the `ams-interventions` folder
3. Write a commit message: "Initial commit - AMS Interventions website"
4. Click "Commit changes"

#### Step 4: Enable GitHub Pages
1. In your repository, click "Settings"
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Wait 1-2 minutes for deployment

#### Step 5: Visit Your Website!
Your site will be live at:
```
https://[your-username].github.io/ams-interventions/
```

For example: `https://mrbsocialstudies.github.io/ams-interventions/`

### Option 2: View Locally (Testing)

#### On Mac/Linux:
1. Open Terminal
2. Navigate to the folder:
   ```bash
   cd path/to/ams-interventions
   ```
3. Start a simple server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open browser to: `http://localhost:8000`

#### On Windows:
1. Simply double-click `index.html`
2. It will open in your default browser

---

## 📝 Adding New Interventions

### Quick Steps:
1. Copy `TEMPLATE.html` to the appropriate tier folder
2. Rename it (e.g., `graphic-organizers.html`)
3. Fill in all the sections (replace all `[BRACKETS]`)
4. Add a card to the tier page (e.g., `tier1.html`)
5. Test locally
6. Upload to GitHub

### Detailed Instructions:

#### 1. Create the Detail Page
```bash
# Copy the template
cp TEMPLATE.html interventions/tier1/your-intervention-name.html
```

Open the new file and replace:
- `[INTERVENTION NAME]` - e.g., "Graphic Organizers"
- `[ICON]` - e.g., "🗂️"
- `[1/2/3]` - The tier number
- All other bracketed sections with real content

#### 2. Add to the Tier List Page
Open `tier1.html` (or tier2/tier3) and add this inside the `<div class="intervention-list">`:

```html
<a href="interventions/tier1/your-intervention-name.html" class="intervention-card" data-tags="instruction">
    <h3>🗂️ Your Intervention Name</h3>
    <div class="rating">★★★★★</div>
    <p class="description">Brief description of what this intervention does.</p>
    <p><strong>Best for:</strong> Who this helps</p>
</a>
```

#### 3. Test Locally
Open the tier page in your browser and click your new intervention link. Make sure:
- All links work
- Images display (if any)
- Print button works
- Back button returns to tier page

#### 4. Upload to GitHub
```bash
git add .
git commit -m "Add new intervention: [name]"
git push origin main
```

Wait 1-2 minutes for GitHub Pages to update.

---

## 🎨 Customizing the Design

### Change Colors

Edit `css/style.css` and modify the CSS variables:

```css
:root {
    --tier1-color: #4A90E2;  /* Blue for Tier 1 - Universal */
    --tier2-color: #F5A623;  /* Orange for Tier 2 - Targeted */
    --tier3-color: #7ED321;  /* Green for Tier 3 - Intensive */
    --accent-color: #D0021B; /* Red for warnings/alerts */
}
```

### Change Fonts

In `css/style.css`, find:
```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...
}
```

Replace with your preferred font.

### Add School Logo

1. Add your logo image to `assets/images/logo.png`
2. In `index.html`, add inside the `<header>`:
```html
<img src="assets/images/logo.png" alt="AMS Logo" style="height: 60px;">
```

---

## 🔧 Common Issues & Solutions

### Issue: GitHub Pages Shows 404 Error
**Solution:** 
- Make sure you selected "main" branch (not "master")
- Wait 2-3 minutes for deployment
- Check that `index.html` is in the root directory

### Issue: CSS Not Loading
**Solution:**
- Check file paths - they're case-sensitive!
- Make sure `css` folder is uploaded
- Try hard refresh: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)

### Issue: Links Don't Work
**Solution:**
- Use relative paths, not absolute
- Correct: `css/style.css`
- Incorrect: `/css/style.css` or `C:/Users/css/style.css`

### Issue: Search Doesn't Work
**Solution:**
- Make sure `js/main.js` is uploaded
- Check browser console for errors (F12 > Console)

---

## 📱 Mobile Optimization

The site is already mobile-responsive! Test it by:
1. Opening on your phone
2. Or in Chrome: F12 > Click phone icon > Select device

If something looks off on mobile:
- Check `css/style.css` under `@media (max-width: 768px)`
- Adjust padding, font sizes, or layouts there

---

## 🤝 Collaborating with Other Teachers

### If Multiple People Want to Edit:

#### Option A: One Person Manages (Simplest)
- One tech-savvy teacher handles all updates
- Others email content, they upload it

#### Option B: Full Collaboration (Advanced)
1. Each person forks the repository
2. Makes changes in their fork
3. Submits a Pull Request
4. Main person reviews and merges

---

## 📋 Maintenance Checklist

### Monthly:
- [ ] Add any new interventions discovered
- [ ] Update ratings based on teacher feedback
- [ ] Fix any broken links

### Quarterly:
- [ ] Review analytics (if set up) to see most-viewed pages
- [ ] Get teacher feedback on usefulness
- [ ] Update research citations

### Annually:
- [ ] Full content review
- [ ] Update based on new research
- [ ] Archive outdated interventions

---

## 🎓 Training Staff

### 5-Minute Staff Meeting Intro:
1. Show the homepage
2. Demo navigating to Tier 1
3. Click into one intervention (e.g., Modeling)
4. Show print button
5. Give them the URL

### 15-Minute Department Meeting:
1. Overview of MTSS framework
2. Navigate the site together
3. Each person finds one intervention they'll try
4. Discuss how to collaborate across classrooms

### PD Day Workshop:
1. Deep dive into 3-4 key interventions
2. Teachers plan implementation
3. Set up data tracking systems
4. Schedule follow-up check-ins

---

## 📞 Getting Help

### For Technical Issues:
- GitHub Help: https://docs.github.com/en/pages
- HTML/CSS Basics: https://www.w3schools.com

### For Content Questions:
- Department chairs
- MTSS coordinator
- Your colleagues who contributed to this toolkit

---

## 🎉 Success Metrics

You'll know the site is successful when:
- [ ] Teachers can find interventions in under 30 seconds
- [ ] At least 3 teachers have implemented something new
- [ ] Teachers share the link with each other
- [ ] You see collaboration across departments
- [ ] Students benefit from more consistent interventions

---

## Next Steps

1. **This Week:** Get the site live on GitHub Pages
2. **Next Week:** Share with your department
3. **This Month:** Get feedback, add 2-3 more interventions
4. **This Year:** Build it into school-wide MTSS process

**Remember:** This is a living resource. Start small, iterate, and improve!

---

**Questions?** Create an issue on GitHub or reach out to the AMS MTSS coordinator.
