# E3DC Bill

CLI to generate bills out of E3DC wallbox data.

## Installation

```sh
npm install -g e3dc-bill

e3dc-bill configure
```

## Usage

```sh
e3dc-bill generate-charging-invoice --help
```

returns

```
Usage: e3dc-bill generate-charging-invoice [options]

Generate a sheet with charging data of a timespan

Options:
  --invoice-number <number>  Invoice number
  --unit-price <price>       Unit price for energy
  --invoice-date <date>      (optional) Invoice date. Defaults to today.
  --from <date>              (optional) ISO-8601 starting date from which the data is retrieved (default:
                             "2024-12-01")
  --to <date>                (optional) ISO-8601 end date to which the data is retrieved (default: "2024-12-31")
  -h, --help                 display help for command
```

