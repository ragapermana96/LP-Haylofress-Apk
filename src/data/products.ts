import { Product } from '../types';

const RAW_PRODUCTS = [
  // --- 1. DAGING AYAM ---
  {
    id: 'ayam-sayap',
    name: 'Sayap Ayam Besar',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 32000,
    priceGrosir: 29500,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh9BVVTTKoYP8wTcXScEYB9iHr9ozVDT6OxCVQEzCtNEfmu2UNJZqXXp2_VzQEnnYuuE5oZFHrTqd0tcHwlKqDAzA5Pv6ANdSDUYgOyjrfeIicpKpvZTXzku-PD7CvGVgkzZVe07qLfr8_hebA67ckd_3n_N4ilC24fvzNGJ-7D1n5dBxDjcb6b9nyc8ktT/s320/1.jpg',
    description: 'Sayap ayam utuh segar berkualitas, sangat cocok untuk digoreng crispy atau bahan sup harian.'
  },
  {
    id: 'ayam-parting',
    name: 'Ayam Parting (Potong 8/10/12)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 35000,
    priceGrosir: 32000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidJjeKEudL9gGPf2LU_8IJ0z0QzFiOGucdas0zdDXoqekoX41SEzmmq3T1XbthYze1rCVv5yjvKmmYWUBiwyu_3Ty7N5vBQ2KY8A7nPbLAsHbDyoIKmBY4c7DhXi9f4qa-mOkjXHpvczLptjh39Raw9hxc2TpbiZM8qu88a7MGVCbTRkUSNEr6iqWeRjaJ/s320/2.jpg',
    description: 'Ayam karkas utuh dipotong presisi menjadi 8, 10, atau 12 bagian. Praktis untuk kebutuhan hajatan atau katering.'
  },
  {
    id: 'ayam-paha-kecil',
    name: 'Paha Kecil Ayam (Drumstick)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 34000,
    priceGrosir: 31000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqaRk8RDb0-z3NXYNsS0eBJKfGS60QN1yzIFJ1Rd7z0hbl8vYQkuqoELG4GhL34G3piVD58ByOTkSZH36ofHGc6ai9-cBMqFgafO7S1wsU7MSGv3XHPLNolxtAxqkbyqG3eUIid1_Mu1f7ap6uHnHvafS7H92XMa9hSVHfrDLoZTArWogvioVyHjpx1Aea/s320/3.jpg',
    description: 'Bagian paha bawah ayam (drumstick) yang empuk dan juicy, menjadi favorit anak-anak.'
  },
  {
    id: 'ayam-paha-besar',
    name: 'Paha Besar Ayam (Thigh)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 36000,
    priceGrosir: 33000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqaRk8RDb0-z3NXYNsS0eBJKfGS60QN1yzIFJ1Rd7z0hbl8vYQkuqoELG4GhL34G3piVD58ByOTkSZH36ofHGc6ai9-cBMqFgafO7S1wsU7MSGv3XHPLNolxtAxqkbyqG3eUIid1_Mu1f7ap6uHnHvafS7H92XMa9hSVHfrDLoZTArWogvioVyHjpx1Aea/s320/3.jpg',
    description: 'Paha atas ayam segar dengan kuantitas daging melimpah, sangat cocok untuk ayam bakar atau goreng.'
  },
  {
    id: 'ayam-paha-utuh',
    name: 'Paha Utuh Ayam',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 35000,
    priceGrosir: 32000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqaRk8RDb0-z3NXYNsS0eBJKfGS60QN1yzIFJ1Rd7z0hbl8vYQkuqoELG4GhL34G3piVD58ByOTkSZH36ofHGc6ai9-cBMqFgafO7S1wsU7MSGv3XHPLNolxtAxqkbyqG3eUIid1_Mu1f7ap6uHnHvafS7H92XMa9hSVHfrDLoZTArWogvioVyHjpx1Aea/s320/3.jpg',
    description: 'Gabungan paha atas dan paha bawah ayam utuh dengan potongan rapi, tekstur lembut berkualitas.'
  },
  {
    id: 'ayam-dada-utuh',
    name: 'Dada Utuh Ayam',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 37000,
    priceGrosir: 34000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=600',
    description: 'Dada ayam segar utuh dengan tulang, kaya protein tinggi dan rendah lemak lemak jahat.'
  },
  {
    id: 'ayam-filet-dada',
    name: 'Filet Dada Ayam (Boneless Breast)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 48000,
    priceGrosir: 44000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhyOwb4r3YER4pDV9PPVT4N8UkVRmlM_Z7xDeKc3i0xsOAef5Sq0iu-GkDvs2_tyLfyb9_jbQRAPR9gwslmcXF4jDeEZpQExrTGKiziCiqzTYKx35-ZH_d2b5qAErmtGEpE2AUt01smuck5d1m-man8yd6Spj-w1A2-B1ragVGN1i6ENsVn8gPlwd5Xp4kI/s320/4.jpg',
    description: 'Daging dada tanpa tulang dan tanpa kulit. Bersih sempurna, andalan diet sehat dan usaha bento/katsu.'
  },
  {
    id: 'ayam-slice-dada',
    name: 'SLice Dada',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 49000,
    priceGrosir: 45000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgOlRaioKJ8LYnBZcoZ2WiZHTPtf4_F9vVXpHa5JZzm20vL3xkz27t25DVs36B7DjwbyenYK_A0Wd9aJij4-9FnR_1__E4G5v9xNR_QuvTtQDWhjxxBf3slgOH_sYy7MdochF3Nm8y5vwtD-GL8IkYPZW5dIEDAp86UmaiU7scOxSiTY8xHAR0au6kaE0uE/s320/Katalog%20JMC.jpg',
    description: 'Irisan tipis daging dada ayam segar pilihan berkualitas premium, sangat cocok untuk tumisan, katsu, shabu, atau panggangan cepat.'
  },
  {
    id: 'ayam-giling-a',
    name: 'Daging Ayam Giling A (Premium)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 50000,
    priceGrosir: 46000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiJAos8ITQ-KGHxXBEiLJ5A_Cl78bNTWpU0AiYi0NX3EWSw-5Y532HUBpG5VIVJaPdu9x-hdKAxb1055O9ECW7XXYbbsQFm9MKCXvDDO-AVA_HUH4jbO3xLfHE4jaaWxcQso-Fov9kEIaI6N4VLnJJO-OgVOJ_eUiVxg3ml8GKadoSEViujlGGgkcAEo4el/s320/Frozen%20(6).jpg',
    description: 'Daging ayam giling halus kualitas premium super dari dada filet, rendah lemak, tanpa campuran air berlebih.'
  },
  {
    id: 'ayam-giling-b',
    name: 'Daging Ayam Giling B (Standard)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 42000,
    priceGrosir: 38500,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg3Rg2AVy4gEpqp2i1oDPQpbYr2Ct1NQEAQw32yA-NuoR679GwJIg2YydKOAQyEJjvT1C5qrTBZvluiALMeW_8tSnxtFH11t0p0rLTuTNVbiJYqg5G6ExIb7G7EgAcs4jOHSORI5lG4PLEQ7viTa_lA3KX9NB40Yz7fczrX2HEAhVGtW3CxGgbXZU_qobBv/s320/Frozen%20(7).jpg',
    description: 'Daging ayam giling kualitas medium campuran paha dan dada, tekstur ideal untuk bakso atau siomay.'
  },
  {
    id: 'ayam-giling-c',
    name: 'Daging Ayam Giling C (Ekonomis)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 35000,
    priceGrosir: 32000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj6QWfcUBndlFRr9nHzTQeA3g43idhwdv7shZDQ7e3caR6JnRp-7KYMpO0YwJv219rQyMq06hN2He3CqbT23x48Dtmq3gkiejtxRU0-XkNn96eGQwNjMOPJz-EhKkIBig4-xwAT0Cyx4UbEKA2hw7awkNT3mwlTrauPrgROCYsvTRuI1W8TfiArKMVCpjm1/s320/Frozen%20(8).jpg',
    description: 'Daging ayam giling ekonomis dengan campuran kulit pilihan, gurih alami untuk isian tahu bakso.'
  },
  {
    id: 'olahan-adonan-a',
    name: 'Adonan A',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 38000,
    priceGrosir: 34500,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh-VceK80LdWPfcrQJHA14cDLRb5_xcC0MoFJ1QXJp47jnTnOo1WcGz2f-I1Ucn7wods3hJ9yGVxXrr_5AUbocKQKN_WdiHR2F9VkDtwDK75iyBK1rE409eKw1gitvhxwAil8Bubk8OYoFfsgyYfuFjOmdzOy6HaVruX5nSCjJhz7r_SjIkyKU2qPx594Ae/s320/Katalog%20JMC.jpg',
    description: 'Adonan daging ayam giling olahan khusus grade A siap bentuk, ideal untuk berbagai keperluan kuliner sehat harian Anda.'
  },
  {
    id: 'olahan-adonan-b',
    name: 'Adonan B',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 33000,
    priceGrosir: 29500,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUm6A4F93SFRyTGCbksj7Culi08VAanmGxIMuqDG8K72r2v4OTrdZ7QIk3aK2PeKDkk6p7M7aWKqmPpZzcWcmOCFLnoBqwjf2ahnyb1mo8BVOTk408Rgmr10JeyBOitNwZS6U1iM4wY0gr5t-r7Ry-X9FbFwFp6MDosj6s7lJIedL9H430QdT6WBnKDpJV/s320/Katalog%20JMC%20(2).jpg',
    description: 'Adonan daging ayam giling olahan grade B gurih bercita rasa tinggi, praktis untuk membuat pentol atau dimsum lezat.'
  },
  {
    id: 'olahan-adonan-c',
    name: 'Adonan C',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 28000,
    priceGrosir: 25000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhwP_Y17jnZ8sK_mBkwYJDjWiruDeVHOFryCg6N6NEeTRTA3L_nc0VBv8B8DsVhzzG7kdXrqnlK0sq2OI6QoVs1ERKubgtbGaSfPsky49ETXzxGHAaCL7dfEXdAg7d2jsgLW8OzUsTo3HI5wGspPy4kkgBdpxBRKorQ4iVfe-Ok3xQ7KyLwHANZOy0QM0gA/s320/Katalog%20JMC%20(1).jpg',
    description: 'Adonan ekonomis grade C kaya bumbu dan super gurih, cocok sebagai isi tahu bakso, cilok daging, atau gorengan kreatif.'
  },
  {
    id: 'olahan-pentol-ayam',
    name: 'Pentol Ayam',
    category: 'ayam',
    unit: 'Pack',
    priceEcer: 25000,
    priceGrosir: 22000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcXv0IkanVUaQgr63R-1CCpjiywDX1HCGcWMUTHac948DWv_NdFvkKDK-pZ5Vz8dFCLyxn4I8pyVrQbCFQOB6PJR-hanSCfLGaM08WktAi113NpNrDoG0rPgbBBxM2yxGDGV5-ufVG66x78sI9U8FlAcHp_K4RTL1dct7C4mQG83jx5FwxWVLKVMGnPCXT/s320/olahan%20(2).jpg',
    description: 'Pentol ayam kenyal berkaldu premium rasa daging ayam mantap, sangat disukai anak-anak dan praktis untuk camilan instan.'
  },
  {
    id: 'olahan-rolade-ayam',
    name: 'Rolade Ayam',
    category: 'ayam',
    unit: 'Roll',
    priceEcer: 22000,
    priceGrosir: 19500,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDS0JDn2qa4DOEt8J5SHjy-dSvpkirf5cNYCMmmEPH8TO3O0jGVe-6I4RVLrfwrh62Rj5azAq0knzDxDCCmoL2YWAhjG9CNC22AAsmHjU1DpCt7boj7Ujb2JKzDfQXhzDVB2A0GnILbpaOJiji6BmmOH3u5pMLz1yQFszFO6Agf4T9Ig9UW1OxdXuq1K9m/s320/olahan%20(1).jpg',
    description: 'Rolade ayam lezat berbungkus telur tipis dengan bumbu rempah bercita rasa klasik, siap iris dan digoreng crispy.'
  },
  {
    id: 'ayam-ceker-bersih',
    name: 'Ceker Ayam Bersih (Tanpa Kuku)',
    category: 'ayam',
    unit: 'Kg',
    priceEcer: 25000,
    priceGrosir: 22000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600',
    description: 'Ceker ayam kupas bersih kulit, dicuci steril, dan pastinya sudah dibuang semua kukunya. Siap masak!'
  },

  // --- 2. DAGING SAPI ---
  {
    id: 'sapi-bokong',
    name: 'Bokong / Rump',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 115000,
    priceGrosir: 108000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjsqBw-Q4dgK57UHdm_cOknpo0XZlwJKVvasANv9YEOsNZw043niWOS0V7C1CsuATnlvz76gzBVsFKUP7zpVKfq51_ZYbvR2bXnUX6W9k9L1aeDw_CvM2hJDnvx595xBNgg3pODsi4FGSDXi3u9JBkrkKfgkapMcVhaKyLWP6st3mZ32aaMp9OSZT_XRrXH/s1080/14.jpg',
    description: 'Potongan daging bokong (rump) berkualitas tinggi, minim lemak. Sangat cocok untuk olahan rendang atau semur.'
  },
  {
    id: 'sapi-paha-depan',
    name: 'Paha Depan / Sampil',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 110000,
    priceGrosir: 103000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgNi5QOu5eNmgH4FSEEwo6K3YI_yg-1WIyBAL71aA0Ht115oT0-Pxq6y4outy7Kj8cLgpFZCkTfyuTbs1fTuJDqzcRSq8aI4KOD-rm8rHBczbmlZV-lCjoqJBXl993-jmviQUZlvr2kqNcGu5XR8U-WkiVtkJcYRlEhUbWfmaJVmpikmjFGh62tBZcKsL7Z/s1080/15.jpg',
    description: 'Daging paha depan sapi (sampik) yang kaya akan serat halus, lezat untuk dendeng, empal, atau abon.'
  },
  {
    id: 'sapi-gandik',
    name: 'Gandik',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 125000,
    priceGrosir: 118000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiiFUlO9WAXCkkrQUZ6r9c74e-V4BnAQfM1VxbkfFfhG06rDKEIxDwt1orE8evIkFwPH1Imz6aZLvzX5870M6Su7QlXf6DLuULjOpwbrbX04xKWKQE2Dt-cTAozdrseocXb-AK2LRxiJXeBTkLqhiT1nABOtr2rQHO2YXWvjJGGDYaKz44CbKMxGSwhTLpu/s1080/16.jpg',
    description: 'Daging gandik padat tanpa lemak, tekstur teratur sehingga tidak mudah hancur saat diiris tipis untuk empal.'
  },
  {
    id: 'sapi-has-dalam',
    name: 'Has Dalam',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 135000,
    priceGrosir: 127000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6Bhp2MHuDiCluhSPRQ8OLzuPexIVPfRDKcAJvwTBQ40BYN2lup_D6eAMdmdmj5XGeThtg1OS837DJyAmpnfxzyIuVzBjKlKuGmGQwftmAQ7z3mZ6V4ejsvQFkPRlhlXBjprQUQ-kD3DHhQyRh9_3X6Ts358vY4tFkNZLZn0LaalDVO2VyzD8EeOgaIDzz/s1080/17.jpg',
    description: 'Bagian terempuk dari sapi (tenderloin). Rendah lemak, sangat lembut dan cepat matang saat dimasak.'
  },
  {
    id: 'sapi-has-luar',
    name: 'Has Luar',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 120000,
    priceGrosir: 113000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiuheNiq9VHwmqnwqNQ5VTziqLIjQrnBYvF5Hv-xcV5XghP0xupjWfHhpusNQtl0iyqNyYHk-chwrCubRu4qXJS3rm3f25C62mzW5DhulXsBJLGyW8DqCSZbBPJOvwvkxNS9bpAg6lIIBBOL-Yd7tGsywjS3K63VSYF_vVU0qiC-BFRfXtWNYzssDQDVpbG/s1080/18.jpg',
    description: 'Lapis daging sirloin premium dengan jalur lemak gurih di sisinya. Sempurna untuk hidangan steak berkualitas.'
  },
  {
    id: 'sapi-buntut',
    name: 'Buntut',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 130000,
    priceGrosir: 122000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiwJy-7JPEeraPSvV4vQSVOUcyg21en9AWDU0AUsUC3phzxjACC2c1rhNtWQe-vgJLwO6l5FzeycfK4HfmV8hvVS0JkcSSY6fNgVMOxf_Head0zVDOkR0AVcsma7sDlLrxlt1diMrr2wKeWJuP9ufXzr0tGQaPgs5k1-qKCvawsxlyx-6b5W-M4TuSC6RV-/s1080/19.jpg',
    description: 'Potongan buntut sapi berkualitas, kaya kolagen dan sangat lezat untuk hidangan sup buntut bakar atau sup original.'
  },
  {
    id: 'sapi-rawonan',
    name: 'Rawonan',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 90000,
    priceGrosir: 83000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh2fhI8OhwPjsquPA6Rnin8-j0CByvcbLZmD-_ax4N3iBRr-o_XOVIFDNooRlvTBcqbeIFHynJf6LMOhmN2d0FEmyybymHwHsUqQifr-cerqO4gu_PdrAsSfzGZa0PAxUh2AUzyQfVFrJ1po-eVSdmEi5J-GeJ5eilxlmmb7raugO0AtDWHKMO6KwC2K_B5/s1080/20.jpg',
    description: 'Daging sapi potong dadu siap masak khusus untuk rawon, diselingi sedikit lemak agar kaldu gurih meresap.'
  },
  {
    id: 'sapi-aman',
    name: 'Sam Sam an',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 75000,
    priceGrosir: 68000,
    minGrosirQty: 5,
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg0GlTXike6MBN7_PhkRUa6LVMmnmsaJtDjKqhZ3cTYqbNVZzyVfnI3_c2Zu6GYxyBFtivjfN7Dcqtt1bsavLZXy7m0zoibq4-t69LPS1dZAfTpSJ724kETiwW00prvN0p78te6_a9RLRcbHHSA2-j9igcw8R3NFTx9PsPJI0j0Nr85nlD5O8zqgg0KXOpC/s1080/21.jpg',
    description: 'Tetelan premium bertekstur juicy gurih (Sam Sam an). Kaya rasa untuk oseng mercon atau dicampurkan ke dalam kuah bakso.'
  },
  {
    id: 'sapi-kisi',
    name: 'Daging Sapi Kisi (Shank)',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 105000,
    priceGrosir: 98000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    description: 'Daging sengkel depan (kisi) yang kaya gelatin, memberikan sensasi legit saat dijadikan soto, sop atau semur.'
  },
  {
    id: 'sapi-urat',
    name: 'Urat Sapi / Sengkel Urat',
    category: 'sapi',
    unit: 'Kg',
    priceEcer: 85000,
    priceGrosir: 78000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=600',
    description: 'Urat tulang rawan sengkel sapi kenyal berkolagen tinggi, andalan utama pengusaha bakso urat dan sop tunjang.'
  },

  // --- 3. DAGING IKAN & SEAFOOD ---
  {
    id: 'ikan-dori-bl20',
    name: 'Filet Dori BL 20%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 38000,
    priceGrosir: 34000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet ikan dori premium dengan garis perut (Belly Line), kadar glaze air es rendah 20%, padat daging.'
  },
  {
    id: 'ikan-dori-nbl20',
    name: 'Filet Dori NBL 20%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 40000,
    priceGrosir: 36000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet ikan dori super bersih tanpa garis lemak perut (No Belly Line), kadar air minimum 20%, rasa gurih alami.'
  },
  {
    id: 'ikan-dori-bl30',
    name: 'Filet Dori BL 30%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 35000,
    priceGrosir: 31000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet ikan dori Belly Line berkualitas standar katering krisis air es 30%, daging lembut berserat halus.'
  },
  {
    id: 'ikan-dori-nbl30',
    name: 'Filet Dori NBL 30%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 37000,
    priceGrosir: 33000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet dori No Belly Line, glazed 30% beku segar, sangat ekonomis namun tetap bertekstur premium.'
  },
  {
    id: 'ikan-dori-bl40',
    name: 'Filet Dori BL 40%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 32000,
    priceGrosir: 28500,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet dori Belly Line dengan proteksi beku glaze es 40%. Harga paling terjangkau, cocok untuk jajanan UMKM.'
  },
  {
    id: 'ikan-dori-nbl40',
    name: 'Filet Dori NBL 40%',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 34000,
    priceGrosir: 30500,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet dori No Belly Line glaze 40%, higienis dikemas steril, harga ekonomis kualitas tetap terjaga.'
  },
  {
    id: 'ikan-lele',
    name: 'Filet Ikan Lele',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 45000,
    priceGrosir: 41000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600',
    description: 'Daging fillet ikan lele segar tanpa duri, tanpa kepala dan kulit luar, praktis tinggal goreng bumbu mentega.'
  },
  {
    id: 'ikan-kakap',
    name: 'Filet Ikan Kakap',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 65000,
    priceGrosir: 59000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600',
    description: 'Fillet kakap merah beku segar, tanpa sisik dan duri, idola sajian restoran premium atau sup asam pedas.'
  },
  {
    id: 'ikan-cumi-ring',
    name: 'Cumi Ring (Cumi Cincin Bersih)',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 75000,
    priceGrosir: 69000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600',
    description: 'Irisan cumi berbentuk cincin yang putih bersih, tanpa kepala, tinta, maupun organ dalam. Kenyal empuk!'
  },
  {
    id: 'ikan-udang-banana',
    name: 'Udang Banana (80-100 pcs)',
    category: 'ikan',
    unit: 'Kg',
    priceEcer: 80000,
    priceGrosir: 74000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=600',
    description: 'Udang putih segar berkulit tipis isi 80 s.d 100 ekor per Kg. Rasa manis alami khas laut.'
  },

  // --- 4. SAYURAN ---
  {
    id: 'sayur-mix3',
    name: 'Mix Vegetables 3 Ways',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 24000,
    priceGrosir: 21000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=600',
    description: 'Campuran 3 jenis sayuran instan bergizi: wortel kubus, buncis potong, dan biji jagung manis.'
  },
  {
    id: 'sayur-mix4',
    name: 'Mix Vegetables 4 Ways',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 26000,
    priceGrosir: 23000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=600',
    description: 'Variasi 4 jenis sayur lengkap: wortel kubus, buncis manis, pipilan jagung, dan kacang polong premium.'
  },
  {
    id: 'sayur-jagung',
    name: 'Jagung Manis Pipil',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 22000,
    priceGrosir: 19000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1551754625-703240296715?auto=format&fit=crop&q=80&w=600',
    description: 'Biji jagung manis segar pilihan yang dipipil bersih, dibekukan terpisah (IQF) agar tidak saling menempel.'
  },
  {
    id: 'sayur-polong',
    name: 'Kacang Polong Premium',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 28000,
    priceGrosir: 25000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80&w=600',
    description: 'Polong hijau manis super segar, bertekstur empuk alami, kaya akan nutrisi serat harian keluarga.'
  },
  {
    id: 'sayur-brokoli',
    name: 'Kuntum Brokoli Hijau',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 25000,
    priceGrosir: 22000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1584006682522-dc17d6c0d9cb?auto=format&fit=crop&q=80&w=600',
    description: 'Potongan kuntum brokoli hijau bersih dan higienis, dicuci steril bebas lintah, praktis tinggal rebus.'
  },
  {
    id: 'sayur-wedges',
    name: 'Kentang Wedges Berbumbu',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 32000,
    priceGrosir: 28000,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
    description: 'Potongan kentang berkulit tebal ala gurih berbumbu herbs rempah premium, renyah di luar lembut di dalam.'
  },
  {
    id: 'sayur-shoestring',
    name: 'Kentang Goreng Shoestring',
    category: 'sayuran',
    unit: 'Kg',
    priceEcer: 30000,
    priceGrosir: 26500,
    minGrosirQty: 5,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
    description: 'Kentang goreng panjang tipis premium ala kafe, sangat renyah krispi setelah digoreng kering.'
  }
];

export const PRODUCTS: Product[] = RAW_PRODUCTS.map(p => {
  // Gracefully calculate realistic multi-tier wholesale prices for default seeding
  const priceNormal = p.priceEcer;
  const priceDiscount = Math.round(p.priceEcer * 0.95); // 5% off
  const priceGrosir1 = p.priceGrosir; // Wholesale 1 (min 10)
  const priceGrosir2 = Math.round(p.priceGrosir * 0.97); // Wholesale 2 (min 100 - 500) - direct extra discount
  const priceGrosir3 = Math.round(p.priceGrosir * 0.94); // Wholesale 3 (min 500+) - ultimate extra discount

  return {
    id: p.id,
    name: p.name,
    category: p.category as any,
    unit: p.unit,
    priceNormal,
    priceDiscount,
    priceGrosir1,
    priceGrosir2,
    priceGrosir3,
    imageUrl: p.imageUrl,
    description: p.description
  };
});
