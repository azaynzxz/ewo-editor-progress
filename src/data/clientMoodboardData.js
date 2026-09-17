/**
 * Ewo Hub - Client Moodboard Database
 * Derived from PT. MATA TERBUKA LEBAR Client Moodboard Specification
 */

export const COMPANY_INFO = {
    companyName: 'PT. MATA TERBUKA LEBAR',
    title: 'MOODBOARD KLIEN',
    subtitle: 'Panduan dan arahan pemahaman dasar atas bentuk style, karakter, background, layout, narasi, dan peraturan khusus di tiap klien.',
    pic: 'M. Ravanda F',
    sopUrl: 'https://drive.google.com/drive/folders/1rogKOXWZdgzUi8ZxgBuEyUYgMtQM2v1w',
    coverBanner: '/moodboard/images/image4.png',
    introBanner: '/moodboard/images/image5.png'
};

export const GENERAL_RULES = [
    {
        id: 'rule-1',
        title: 'Analisa Brief Seksama',
        desc: 'Baca dan analisa brief secara seksama dan detail, pahami tiap kalimat maupun frasa yang ada.'
    },
    {
        id: 'rule-2',
        title: 'Konsistensi Style',
        desc: 'Konsisten dalam pengerjaan Style dan berbagai macam aturan tiap klien.'
    },
    {
        id: 'rule-3',
        title: 'Variasi Scene',
        desc: 'Hindari scene yang sama pada narasi dan durasi yang panjang.'
    },
    {
        id: 'rule-4',
        title: 'Eksklusivitas Aset',
        desc: 'Dilarang memakai aset untuk klien yang berbeda.'
    },
    {
        id: 'rule-5',
        title: 'Hook 30–60 Detik Awal',
        desc: 'Maksimalkan pengerjaan pada 30 detik - 1 menit awal pengerjaan agar lebih menarik penonton.'
    },
    {
        id: 'rule-6',
        title: 'Verifikasi VO & Brief',
        desc: 'Periksa kembali VO dan Brief untuk memastikan ilustrasi tidak ada error dalam pengerjaan.'
    }
];

export const CLIENT_STATUS = {
    ACTIVE: 'active',
    COMING_SOON: 'coming_soon'
};

export const CLIENTS_DATA = [
    {
        id: 'alex',
        name: 'Alex',
        channel: 'OWL Channel',
        status: CLIENT_STATUS.ACTIVE,
        badge: 'Semi Stickman',
        folderUrl: 'https://drive.google.com/drive/folders/1zQaxH11Yy-EkWo3QwxjFk9_GU_hc7a3_',
        specs: {
            characterStyle: 'Flat Semi Stickman',
            backgroundStyle: '2D Cell Shading & Ai Objek/Background (Optional hanya boleh 20%)',
            narratorRequirement: 'Munculkan 15% Total projek',
            hasThumbnail: false,
            projectDuration: '9 menit - 15 menit',
            turnaroundTime: '7 Hari',
            violenceGore: 'Diperbolehkan tapi tidak terlalu over seperti jeroan/organ tubuh',
            sexualContent: 'Tidak Diperbolehkan',
            specialNotes: 'Tambahkan ending khusus di akhir video, biasanya berisikan kalimat sarkas khusus sesuai dengan tema pada proyek.'
        },
        sampleDriveUrl: 'https://drive.google.com/file/d/15DwpuUj0iCOi4jCtGIQ9LkkcF2phj5y-/view?usp=drive_link',
        images: [
            {
                id: 'alex-char',
                src: '/moodboard/images/image6.png',
                category: 'character',
                label: 'Karakter: Semi Stickman',
                aspectRatio: 1.76,
                resolution: '681 × 386 px',
                tag: 'Semi Stickman',
                description: 'Desain karakter flat semi stickman dengan proporsi tubuh khas, outline tegas dan ekspresif.'
            },
            {
                id: 'alex-narrator',
                src: '/moodboard/images/image14.png',
                category: 'narrator',
                label: 'Narator Karakter (15% Durasi)',
                aspectRatio: 1.02,
                resolution: '513 × 505 px',
                tag: 'Narator 15%',
                description: 'Karakter narator khas OWL Channel, wajib dimunculkan sekitar 15% dari total durasi video proyek.'
            },
            {
                id: 'alex-bg-1',
                src: '/moodboard/images/image3.png',
                category: 'background',
                label: 'Background: 2D Cell Shading Scene 1',
                aspectRatio: 1.76,
                resolution: '752 × 427 px',
                tag: '2D Cell Shading',
                description: 'Contoh background 2D cell shading dengan pencahayaan dramatis dan palet warna kontras.'
            },
            {
                id: 'alex-bg-2',
                src: '/moodboard/images/image2.png',
                category: 'background',
                label: 'Background: 2D Cell Shading Scene 2',
                aspectRatio: 1.75,
                resolution: '930 × 530 px',
                tag: '2D / AI (Max 20%)',
                description: 'Perpaduan latar belakang interior dengan elemen shading halus. Objek AI hanya diperbolehkan maksimal 20%.'
            },
            {
                id: 'alex-sample',
                src: '/moodboard/images/image11.png',
                category: 'sample',
                label: 'Sampel Pengerjaan Animasi',
                aspectRatio: 1.65,
                resolution: '343 × 208 px',
                tag: 'Video Sample',
                description: 'Tampilan sampel visual frame animasi pada proyek Alex OWL Channel.'
            }
        ]
    },
    {
        id: 'angelo',
        name: 'Angelo',
        channel: 'Angelo',
        status: CLIENT_STATUS.ACTIVE,
        badge: 'Stickman + AI BG',
        folderUrl: 'https://drive.google.com/drive/folders/1xn7IuyvMeB7XzTvtdXNUeqOIHGLzE8Sj',
        specs: {
            characterStyle: 'Stickman',
            backgroundStyle: 'Ai Objek/Background (Masih boleh menggunakan ilustrasi 2d untuk objek tertentu)',
            narratorRequirement: 'Tidak Ada',
            hasThumbnail: false,
            projectDuration: '10 menit - 16 menit',
            turnaroundTime: '7 Hari',
            violenceGore: 'Diperbolehkan tapi tidak terlalu over seperti jeroan/organ tubuh',
            sexualContent: 'Sensor Kreatif Minimalis',
            specialNotes: 'Perhatikan bagian VO dan Brief terlebih dahulu karena terkadang tidak ada kecocokan antar keduanya. Background sudah disiapkan oleh klien, namun apabila background tidak sesuai dengan brief, illustrator dapat membuat background AI-nya sendiri jika dinilai lebih sesuai.',
            bgPrompt: 'Semi-cartoon semi-realism illustration, thick bold lineart, painterly flat colors, muted renaissance palette, soft grain texture, 2D illustration, no people, no text, background only, dengan ukuran 5760x3240 px, buatkan sebuah gurun pasir dengan beberapa pohon tua yang sudah kering dan langit di malam hari.',
            sheetUrl: 'https://docs.google.com/spreadsheets/d/17qhewU3OsOFm4FRzINWVjebFQThbxQA7RL-crMkXVC0/edit?gid=0#gid=0'
        },
        sampleDriveUrl: 'https://drive.google.com/file/d/1Wk9n3F46aS5ycWAwJXTJfZIUzW_BdsU4/view?usp=drive_link',
        images: [
            {
                id: 'angelo-char',
                src: '/moodboard/images/image8.png',
                category: 'character',
                label: 'Karakter: Stickman Style',
                aspectRatio: 1.79,
                resolution: '567 × 317 px',
                tag: 'Stickman',
                description: 'Style karakter stickman minimalis khas Angelo, ekspresif dengan gesture yang dinamis.'
            },
            {
                id: 'angelo-bg-1',
                src: '/moodboard/images/image15.png',
                category: 'background',
                label: 'Background: AI Generation Scene 1',
                aspectRatio: 1.78,
                resolution: '922 × 517 px',
                tag: 'AI Generated BG',
                description: 'Latar belakang gurun malam hari yang digenerate dengan prompt khusus, bernuansa renaissance muted palette.'
            },
            {
                id: 'angelo-bg-2',
                src: '/moodboard/images/image16.png',
                category: 'background',
                label: 'Background: AI Generation Scene 2',
                aspectRatio: 1.79,
                resolution: '756 × 422 px',
                tag: 'AI Generated BG',
                description: 'Latar belakang dengan tekstur soft grain dan lineart tebal, no text, no people.'
            },
            {
                id: 'angelo-sample',
                src: '/moodboard/images/image12.png',
                category: 'sample',
                label: 'Sampel Pengerjaan Proyek Angelo',
                aspectRatio: 1.79,
                resolution: '917 × 511 px',
                tag: 'Video Sample',
                description: 'Frame visual referensi implementasi stickman di atas background AI.'
            }
        ]
    },
    {
        id: 'jack',
        name: 'Jack',
        channel: 'Jack',
        status: CLIENT_STATUS.ACTIVE,
        badge: '2D Cell Shading Cartoon',
        folderUrl: 'https://drive.google.com/drive/folders/1cHz9l_VRtum-qBbbyH-hSXFW_9fbrw1O',
        specs: {
            characterStyle: '2D Cell Shading Cartoon',
            backgroundStyle: 'Mix Cartoon Background (Tambahkan Efek Glow pada background agar lebih cinematik sesuai dengan contoh/referensi dan tidak boleh ada penggunaan Objek/Background AI)',
            narratorRequirement: 'Tidak Ada',
            hasThumbnail: true,
            projectDuration: '8 menit - 16 menit',
            turnaroundTime: '8 Hari',
            violenceGore: 'Diperbolehkan tapi tidak terlalu over seperti jeroan/organ tubuh',
            sexualContent: 'Sensor Kreatif Minimalis',
            specialNotes: 'Animasi menggunakan gaya yang lebih detail dan cenderung memiliki gerakan yang lebih halus, style dari ilustrator harus dimaksimalkan pada klien ini. Terdapat juga bagian cinematik yang harus dipertegas dalam style ilustrasi.',
            competitorRef: {
                title: "WW2's BEST Soldiers...",
                channel: '@HeyHistorically',
                url: 'https://www.youtube.com/@HeyHistorically'
            }
        },
        sampleDriveUrl: 'https://drive.google.com/file/d/1Um4tPbBGCjyZFy9-upZl0i4U6tgQSLhD/view?usp=drive_link',
        images: [
            {
                id: 'jack-char',
                src: '/moodboard/images/image10.png',
                category: 'character',
                label: 'Karakter: 2D Cell Shading Cartoon',
                aspectRatio: 1.76,
                resolution: '820 × 466 px',
                tag: '2D Cell Shading',
                description: 'Style karakter cartoon yang sangat detail, pencahayaan dramatis, dan shading bertingkat.'
            },
            {
                id: 'jack-bg-1',
                src: '/moodboard/images/image19.png',
                category: 'background',
                label: 'Background: Mix Cartoon dengan Glow Effect',
                aspectRatio: 1.76,
                resolution: '752 × 428 px',
                tag: 'No AI / Glow FX',
                description: 'Background murni ilustrasi 2D dengan efek ambient glow cinematik. Dilarang memakai background AI.'
            },
            {
                id: 'jack-bg-2',
                src: '/moodboard/images/image13.png',
                category: 'background',
                label: 'Background: Scene Cinematik',
                aspectRatio: 1.75,
                resolution: '753 × 430 px',
                tag: 'Cinematic Atmosphere',
                description: 'Pencahayaan atmosferik dengan depth-of-field kuat untuk mendukung narasi video sejarah / perang.'
            },
            {
                id: 'jack-sample',
                src: '/moodboard/images/image17.png',
                category: 'sample',
                label: 'Sampel Pengerjaan Proyek Jack',
                aspectRatio: 1.77,
                resolution: '932 × 528 px',
                tag: 'Video Sample',
                description: 'Frame referensi komposisi pengerjaan ilustrasi dan karakter dalam scene aksi.'
            }
        ]
    },
    {
        id: 'julia',
        name: 'Julia',
        channel: 'Julia',
        status: CLIENT_STATUS.ACTIVE,
        badge: 'Flat Semi Stickman + AI',
        folderUrl: 'https://drive.google.com/drive/folders/1-MHkMadgOu6LbTkhXBI-KlfFe8ySWk3E',
        specs: {
            characterStyle: 'Flat Semi Stickman',
            backgroundStyle: 'Mix Style (Flat Background + AI)',
            narratorRequirement: 'Tidak Ada',
            hasThumbnail: false,
            projectDuration: '9 menit - 14 menit',
            turnaroundTime: '7 Hari',
            violenceGore: 'Hanya diperbolehkan luka lecet dan kekerasan yang minim',
            sexualContent: 'Sensor Kreatif Minimalis',
            specialNotes: 'Ilustrasi harus seminimal mungkin karena menyesuaikan dengan budget dan harus tetap menggunakan style flat dan AI sekaligus juga dengan gerakan karakter yang lebih minimalis ketimbang projek lainnya.'
        },
        sampleDriveUrl: 'https://drive.google.com/file/d/1_Aust0iQqr-5z5te2tFI1wReAogEuhOy/view?usp=drive_link',
        images: [
            {
                id: 'julia-char',
                src: '/moodboard/images/image1.png',
                category: 'character',
                label: 'Karakter: Flat Semi Stickman (Panorama Strip)',
                aspectRatio: 2.71,
                resolution: '846 × 312 px',
                tag: 'Ultra-wide 2.71:1',
                description: 'Lembar referensi karakter baris horizontal yang menampilkan variasi pose karakter semi stickman Julia.'
            },
            {
                id: 'julia-bg-1',
                src: '/moodboard/images/image7.png',
                category: 'background',
                label: 'Background: Mix Flat + AI (Scene 1)',
                aspectRatio: 1.77,
                resolution: '842 × 477 px',
                tag: 'Flat + AI Mix',
                description: 'Latar belakang mix flat design dengan sentuhan AI untuk efisiensi pengerjaan sesuai budget.'
            },
            {
                id: 'julia-bg-2',
                src: '/moodboard/images/image9.png',
                category: 'background',
                label: 'Background: Mix Flat + AI (Scene 2)',
                aspectRatio: 1.76,
                resolution: '752 × 427 px',
                tag: 'Minimalist Motion',
                description: 'Latar bernuansa hangat dengan elemen visual bersih untuk gerakan animasi minimalis.'
            },
            {
                id: 'julia-sample',
                src: '/moodboard/images/image18.png',
                category: 'sample',
                label: 'Sampel Pengerjaan Proyek Julia',
                aspectRatio: 1.73,
                resolution: '742 × 428 px',
                tag: 'Video Sample',
                description: 'Contoh frame animasi pengerjaan proyek Julia.'
            }
        ]
    },
    // Upcoming Clients listed in document table of contents
    {
        id: 'bryan',
        name: 'Bryan',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam tahap finalisasi oleh tim Creative Lead.'
    },
    {
        id: 'christen',
        name: 'Christen',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam tahap perumusan arahan style.'
    },
    {
        id: 'damian',
        name: 'Damian',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam tahap penyusunan asset referensi.'
    },
    {
        id: 'dena',
        name: 'Dena',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam persiapan pengerjaan awal.'
    },
    {
        id: 'lukas',
        name: 'Lukas',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien dalam proses review oleh manajemen.'
    },
    {
        id: 'meisha',
        name: 'Meisha',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam antrean penjadwalan style.'
    },
    {
        id: 'bryian',
        name: 'Bryian',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam penyusunan panduan pengerjaan.'
    },
    {
        id: 'miguel',
        name: 'Miguel',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam perumusan format teknis.'
    },
    {
        id: 'patyrick',
        name: 'Patyrick',
        status: CLIENT_STATUS.COMING_SOON,
        badge: 'In Development',
        notes: 'Brief dan moodboard klien sedang dalam tahap finalisasi asset pack.'
    }
];
