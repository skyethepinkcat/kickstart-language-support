<div align="center">

<img src="https://raw.githubusercontent.com/95jonpet/kickstart-language-support/main/icon.png" width="140" />

# Kickstart Language Support

Support for Kickstart (`.ks`) files in Visual Studio Code

</div>

## Features

This extension adds the following features to Visual Studio Code:

- Syntax highlighting for `.ks` files.
- Linting for `.ks` files using `ksvalidator`.
- Snippets for commonly used sections in `.ks` files.

## Linter install

The `ksvalidator` linter can typically be installed using `dnf` or `yum` on RHEL-based distributions of Linux:

```bash
dnf install pykickstart
```

**Note:** The package may be called something different depending on distribution and repo.

For other Linux distributions, [pykickstart](https://pypi.org/project/pykickstart/) can be installed using Python 3 and `pip`:

```bash
python3 -m pip install pykickstart
```
