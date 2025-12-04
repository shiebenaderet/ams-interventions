# AMS Interventions Toolkit

A comprehensive, web-based Multi-Tiered System of Supports (MTSS) intervention guide for Alderwood Middle School educators.

## 🎯 Purpose

This toolkit provides evidence-based interventions organized by tier (1, 2, and 3) with practical, step-by-step implementation guidance. Developed collaboratively by AMS educators, it serves as a living resource for supporting all students across academics, behavior, and life skills.

## ✨ Features

- **Three-Tiered Organization**: Easy navigation by intervention intensity (Universal, Targeted, Intensive)
- **Detailed Implementation Guides**: Each intervention includes:
  - Clear definitions and purpose
  - Quality implementation indicators
  - Step-by-step instructions
  - Multiple implementation approaches
  - Common pitfalls and solutions
  - Research-based effectiveness ratings
  - Printable pages
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Search & Filter**: Quickly find interventions by keyword or category
- **Printable**: Each intervention page can be printed for reference

## 📁 Project Structure

```
ams-interventions/
├── index.html              # Homepage
├── tier1.html             # Tier 1 interventions list
├── tier2.html             # Tier 2 interventions list
├── tier3.html             # Tier 3 interventions list
├── css/
│   └── style.css         # Main stylesheet
├── js/
│   └── main.js           # JavaScript for interactivity
├── interventions/
│   ├── tier1/            # Tier 1 intervention detail pages
│   ├── tier2/            # Tier 2 intervention detail pages
│   └── tier3/            # Tier 3 intervention detail pages
├── assets/
│   └── images/           # Images and graphics
├── README.md             # This file
└── LICENSE              # License information
```

## 🚀 Getting Started

### Viewing Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ams-interventions.git
   cd ams-interventions
   ```

2. **Open in browser**:
   - Simply open `index.html` in your web browser
   - No server or build process required!

### Hosting on GitHub Pages

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "main" branch as source
   - Your site will be available at: `https://yourusername.github.io/ams-interventions/`

## 📝 Adding New Interventions

### Step 1: Add to the Tier Page

Edit the appropriate tier page (`tier1.html`, `tier2.html`, or `tier3.html`) and add a new intervention card:

```html
<a href="interventions/tier1/your-intervention.html" class="intervention-card" data-tags="your-tags">
    <h3>📌 Your Intervention Name</h3>
    <div class="rating">★★★★☆</div>
    <p class="description">Brief description of the intervention.</p>
    <p><strong>Best for:</strong> Who this helps</p>
</a>
```

### Step 2: Create the Detail Page

1. Copy an existing intervention page as a template (e.g., `modeling.html`)
2. Rename it to your intervention name
3. Update the content following the template structure:
   - What It Is
   - Quality Implementation
   - Implementation Approaches
   - Step-by-Step Instructions
   - Common Pitfalls
   - Adaptations
   - Monitoring Success

### Step 3: Update Navigation

Ensure the navigation links in your new page point to the correct paths:
- `../../index.html` - Homepage
- `../../tier1.html` - Back to tier list
- `../../css/style.css` - Stylesheet
- `../../js/main.js` - JavaScript

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `css/style.css`:

```css
:root {
    --tier1-color: #4A90E2;  /* Blue for Tier 1 */
    --tier2-color: #F5A623;  /* Orange for Tier 2 */
    --tier3-color: #7ED321;  /* Green for Tier 3 */
    /* ... other colors ... */
}
```

### Adding New Features

The JavaScript file (`js/main.js`) includes:
- Search functionality
- Filter by tags
- Smooth scrolling
- Back-to-top button
- Print functionality

Add your own functions following the existing patterns.

## 🤝 Contributing

We welcome contributions from all AMS educators!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b new-intervention`
3. **Make your changes**
4. **Test locally** to ensure everything works
5. **Commit your changes**: `git commit -m "Add new intervention: [name]"`
6. **Push to your fork**: `git push origin new-intervention`
7. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing page structure for consistency
- Include research citations when available
- Use clear, educator-friendly language
- Test on multiple devices (desktop, tablet, mobile)
- Proofread for spelling and grammar

## 📚 Current Interventions

### Tier 1 (Universal - All Students)
- Organizational Systems
- Text-to-Speech & Speech-to-Text
- Vocabulary Support
- Graphic Organizers
- Turn and Talk / Think-Pair-Share
- Modeling: I Do, We Do, You Do
- Progress Monitoring
- Greeting Students at the Door
- Choice in Demonstration of Learning
- Retakes and Corrections

### Tier 2 (Targeted - Some Students)
- Small Group Instruction
- Frequent Check-ins
- Differentiated Materials
- Modified Rubrics
- [More to be added]

### Tier 3 (Intensive - Few Students)
- IEP Accommodations
- 504 Accommodations
- Modified Curriculum
- One-on-One Support
- [More to be added]

## 🔧 Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No server or database required
- Works offline once loaded

## 📖 Resources

This toolkit is based on:
- Panorama Education's MTSS Framework
- What Works Clearinghouse research
- Hattie's Visible Learning research
- AMS collaborative planning sessions

### External Links
- [Panorama MTSS Platform](https://www.panoramaed.com/)
- [What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/)
- [Evidence for ESSA](https://www.evidenceforessa.org/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

Developed collaboratively by educators at Alderwood Middle School:
- English/Language Arts Department
- Mathematics Department
- Science Department
- Social Studies Department
- PE/Health Department
- Electives Department
- Counseling Department

Special thanks to all AMS staff who contributed their expertise and classroom experience to this toolkit.

## 📧 Contact

Questions or suggestions? Contact:
- Room 1610 (Mr. B - Social Studies)
- Your department chair
- MTSS Coordinator

## 🔄 Version History

- **v1.0** (December 2024) - Initial release with Tier 1 interventions
- Future updates will add:
  - Complete Tier 2 and Tier 3 intervention pages
  - Video demonstrations
  - Downloadable templates
  - Student data tracking tools

---

**Note**: This is a living document. As we learn more about effective interventions and gather data on what works at AMS, we'll continue to update and improve this resource.
