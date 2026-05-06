# Geonimate

Geonimate is a web app for designing and playing back map animations.

## Demo


|            | Design                                                                               | Player                                                                               |
| ---------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Default    | [Show design](https://robbstankiewicz.github.io/geonimate/design)                    | [Show player](https://robbstankiewicz.github.io/geonimate/player)                    |
| Europe GDP | [Open in player](https://robbstankiewicz.github.io/geonimate/player?demo=europe-gdp) | [Open in design](https://robbstankiewicz.github.io/geonimate/design?demo=europe-gdp) |


## Maps and licensing

Basemap tiles are loaded over **WMTS** from **Esri** services. Use of those maps is subject to **Esri’s terms and attribution requirements**. See Esri’s [data attribution and terms](https://www.esri.com/en-us/legal/terms/full-master-agreement).

## Local development

Serve:

```sh
npx nx serve design
npx nx serve player
npx nx serve showcase
```

Build:

```sh
npx nx build showcase
```

