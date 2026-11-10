# NZ Interactive Mathematics Workbooks

A static, browser-based mathematics practice suite for New Zealand learners in Years 6–11, plus a foundational arithmetic workbook. It combines guided questions, visual examples, tutor customization, and printable answer sheets.

## Workbooks

| File | Description |
| --- | --- |
| `index.html` | Landing page and navigation hub for all seven workbooks |
| `1_interactive_math_workbook.html` | Configurable arithmetic and long-division practice |
| `6_year6_nz_mathematics_workbook.html` | Year 6 curriculum workbook |
| `7_year7_nz_mathematics_workbook.html` | Year 7 curriculum workbook |
| `2_year8_nz_mathematics_workbook.html` | Year 8 curriculum workbook |
| `3_year9_nz_mathematics_workbook.html` | Year 9 curriculum workbook |
| `4_year10_nz_mathematics_workbook.html` | Year 10 curriculum workbook |
| `5_year11_nz_mathematics_workbook.html` | Year 11 curriculum workbook |

## Features

- Guided, multi-step questions with immediate answer feedback
- Curriculum topics organized by strand and sub-strand
- Random practice sets, progress indicators, stars, streaks, and timers
- Tutor mode for customizing questions
- Text notes and a drawing scratchpad
- Printable and downloadable answer sheets
- Prepared math topic guides and a built-in calculator with formula reference
- Browser-local progress saving and recovery

Progress is saved in the current browser and does not sync between devices. Browser privacy settings or restrictions on local files may prevent storage from working.

## Project Structure

```text
index.html
1_interactive_math_workbook.html
2_year8_nz_mathematics_workbook.html
3_year9_nz_mathematics_workbook.html
4_year10_nz_mathematics_workbook.html
5_year11_nz_mathematics_workbook.html
6_year6_nz_mathematics_workbook.html
7_year7_nz_mathematics_workbook.html
assets/
  favicon.svg
  css/
    site.css
    interactive-workbook.css
    curriculum-workbook.css
  js/
    site.js
    interactive-workbook.js
    year6-workbook.js
    year7-workbook.js
    year8-workbook.js
    year9-workbook.js
    year10-workbook.js
    year11-workbook.js
```

The year-level workbooks share a stylesheet and keep their question logic in separate JavaScript files. The site is static and does not need a backend, package installation, or build step.

## Run Locally

Open `index.html` in a modern browser. Keep the `assets/` folder alongside the HTML files. You can also open an individual workbook HTML file directly.

## Publish with GitHub Pages

Publish the repository with GitHub Pages using the repository's Pages settings. The landing page loads the workbook HTML files and assets from the same published site.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- SVG favicon

## Contributing

Suggestions, curriculum feedback, and improvements are welcome. Please open an issue or pull request in the project repository.

## License

No license file is included yet. The project owner should choose and add a license before inviting reuse or redistribution.

## Author

Created by Dulsanka Kulasinghe.
