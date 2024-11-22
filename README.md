## Installation

```bash
$ npm install resume-parser
```

## Usage

```
const resumeParser = require('resume-parser');

resumeParser(`${filePath}`)
  .then((res) => { console.log(res) })
  .catch((error) => { console.log(error) });
```