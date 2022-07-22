[![Node.js CI](https://github.com/klcodanr/markdown-page-validator/actions/workflows/node.js.yml/badge.svg)](https://github.com/klcodanr/markdown-page-validator/actions/workflows/node.js.yml) [![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Markdown Page Checker

Runs checks against markdown pages with YAML front matter. Useful for validating static sites published with systems like Jekyll or Hugo. 

## Installation

Markdown Page Checker is available on npm. Install it with the following command:

    npm install markdown-page-checker

You can also install it globally with:

    npm install -g markdown-page-checker

## Use

Markdown Page Checker supports use as a CLI or via the API. 

### CLI Use

First, create a configuration file to configure the checks and their settings, for example:


```
{
  "modeConfig": {
    "excludes": ".*(node_modules|README|_includes|_site|).*",
    "includes": ".*\\.md"
  },
  "checks": [
    {
      "name": "DateRange",
      "settings": {
        "property": "lastReview",
        "beforeOffset": 90,
        "afterOffset": 90,
        "includes": "[alerts|howto].*"
      }
    },
    {
      "name": "Readability",
      "settings": {
        "errorLimit": 12,
        "warnLimit": 9
      }
    },
    {
      "name": "RequiredProperties",
      "settings": {
        "properties": ["title", "maintainer"]
      },
    },
    {
      "name": "RequiredProperties",
      "settings": {
        "properties": ["alertname"]
      },
      "includes": "alert/.*"
    },
    {
      "name": "Spelling"
    },
    {
      "name": "WriteGood"
    }
  ]
}
```

Then, run with:

    npx markdown-page-checker validate --config [config.json] --path [site-path] --format [output-format]

### API Usage

If you want to add custom checks or incorporate the validator into your code run:

    npm install markdown-page-checker

And then you can import it with:

    import {Validator} from 'markdown-page-checker'

    const validator = new Validator();
    const result = await validator.validate("./some/path", {
        mode: Mode.Matching,
        checks: [
            {
                name: "WriteGood",
            },
            {
                name: "RequiredProperties",
                settings: {
                    properties: [
                        "title",
                        {
                            property: "layout",
                            allowedValues: ["default"],
                        },
                    ],
                },
            },
        ],
    });

## OOTB Checks

Markdown Page Checker includes the following checks:

### DateRange
Validates that a date field is between an offset range

**Settings:**
- property: string - the property to check in the YAML frontmatter
- afterOffset: optional number - the number of MS from the current date the date value is allowed to be after
- beforeOffset: optional number - the number of MS from the current date the date value is allowed to be after

### Readability
Validates that the body of a page is below a readability target

- warnLimit: optional number - any readability score above this number will trigger a warning
- errorLimit: optional number - any readability score above this number will trigger an error
- includeDetail: boolean - if true, the full detail including all the supported complexity scores will be included in the detail of the results


### RequiredProperties
Validates that required properties (and optional valid values) exist in the YAML frontmatter of a page

- property: string the property to check
- allowedValues: optional Array\<any> - the allowed values for the property
- invalidStatus?: Status - the status to use if the page does not have the property or the property does not have a valid value

### Spelling
Validates the spelling of the words in the body of a page

- customWords: optional Array\<string> - a list of words to add to the dictionary
- warnLimit: optional number - misspelled word count above this number will trigger a warning
- errorLimit: optional number - misspelled word count  above this number will trigger an error

### WriteGood
Validates common writing mistakes, see https://github.com/btford/write-good

- warnLimit: optional number - issues count above this number will trigger a warning
- options: optional object - a WriteGood options object, see: https://github.com/btford/write-good#api





