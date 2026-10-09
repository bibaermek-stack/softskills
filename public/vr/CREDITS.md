# VR сахналарының ресурстары

| Файл | Дереккөз | Лицензия |
|------|----------|----------|
| `textures/earth_day.jpg`, `earth_normal.jpg`, `earth_clouds.jpg`, `earth_night.jpg`, `earth_roughness.jpg`, `moon.jpg` | three.js репозиторийі, `examples/textures/planets` (NASA Blue Marble негізінде) | MIT |
| `textures/mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `stars.jpg` | NASA 3D Resources (nasa3d.arc.nasa.gov) | NASA медиа-ережесі: авторлық құқықпен қорғалмайды |
| `hdri/studio.hdr` (monochrome_studio_02), `hdri/desert.hdr` (quarry_01) | Poly Haven, three.js репозиторийі арқылы, 512 × 256-ға кішірейтілген | CC0 |
| `models/yasawi.bin` | Жоба иесі берген STL моделі: Sketchfab, «Mausoleum of Khoja Ahmed Yasawi», авторы Adil77 | Sketchfab-тағы лицензия шарттары тексерілуі тиіс (CC BY болса — авторды көрсету міндетті) |

`models/yasawi.bin` файлы STL-ден `scripts/vr/build_yasawi.py` арқылы жасалады:

```
python3 scripts/vr/build_yasawi.py Untitled.stl public/vr/models/yasawi.bin
```

Скрипт төбелерді біріктіреді, үшбұрыштарды материал топтарына (кірпіш, баннаи қабырға,
шатыр, күмбездер, барабандар, ағаш арқалықтар) бөледі және өлшемді метрге келтіреді
(1 бірлік = 0,25 м). Кірпіш, баннаи өрнегі, глазурь, құм, тас, эпоксид еден, картон,
ағаш текстуралары `vr-scenes.js` ішінде процедуралық түрде жасалады. Аспан моделі
three.js `Sky.js` (MIT) негізінде жазылған.
