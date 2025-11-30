# DraftShift Documentation Source

This repository contains the source code for the DraftShift documentation website.

Visit [https://draftshift.github.io/Docs](https://draftshift.github.io/Docs) for the actual documentation.



---

## Contributing

We welcome contributions! If you'd like to help improve the documentation:

- Submit a descriptive [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) of the feature/issue you are addressing.

- Keep the documented information concise.

### Contributing Build Guides

If you want to contribute build guides, please refer to the [Build Guide documentation](CONTRIBUTING_GUIDES.md) for more information.

### Development Setup

To run the documentation site locally:

1. **Prerequisites**: Ensure Python is installed and included in your environment PATH.

2. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

3. **Run the development server**:
   ```
   python -m mkdocs serve
   ```

The site will be available at `http://127.0.0.1:8000` with live reload enabled.
