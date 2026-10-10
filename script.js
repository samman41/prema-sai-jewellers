document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // POPULATE PAGE FROM CONFIG
    // ============================================================
    const cfg = BUSINESS_CONFIG;

    // --- Page Title ---
    document.title = `${cfg.company.name} | ${cfg.company.tagline}`;

    // --- Logo ---
    const logoEl = document.getElementById('logo');
    if (logoEl) {
        logoEl.src = cfg.logo.src;
        logoEl.alt = cfg.logo.alt;
    }

    // --- Header: Person Details (shown when scrolled) ---
    const personNameEl = document.getElementById('person-name');
    const personTitleEl = document.getElementById('person-title');
    if (personNameEl) personNameEl.textContent = cfg.person.fullName;
    if (personTitleEl) personTitleEl.textContent = cfg.person.title;

    // --- First Page: Company Name & Tagline (shown on logo page) ---
    const companyNameEl = document.getElementById('company-name');
    if (companyNameEl) companyNameEl.textContent = cfg.company.name;

    const companyTaglineEl = document.getElementById('company-tagline');
    if (companyTaglineEl) companyTaglineEl.textContent = cfg.company.tagline;


    // --- About Section ---
    const aboutHeadingEl = document.getElementById('about-heading');
    const aboutTextEl = document.getElementById('about-text');
    if (aboutHeadingEl) aboutHeadingEl.textContent = cfg.company.aboutHeading;
    if (aboutTextEl) aboutTextEl.textContent = cfg.company.aboutText;

    // --- Action Buttons ---
    const btnCall = document.getElementById('btn-call');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnLocation = document.getElementById('btn-location');
    const btnReview = document.getElementById('btn-review');

    if (btnCall) btnCall.href = `tel:${cfg.contact.phones[0].number}`;
    if (btnWhatsapp) btnWhatsapp.href = `https://wa.me/${cfg.contact.whatsapp.replace(/[^0-9]/g, '')}`;
    if (btnEmail) btnEmail.href = `mailto:${cfg.contact.email}`;
    if (btnLocation) btnLocation.href = cfg.contact.locationUrl;
    if (btnReview) btnReview.href = cfg.contact.reviewUrl;

    // --- Social Media Icons (dynamically generated) ---
    const socialBar = document.getElementById('social-bar');
    if (socialBar) {
        cfg.socials.forEach(social => {
            const a = document.createElement('a');
            a.href = social.url;
            a.target = '_blank';
            a.className = 'social-icon';
            a.setAttribute('aria-label', social.platform);

            const i = document.createElement('i');
            i.className = social.icon;
            a.appendChild(i);

            socialBar.appendChild(a);
        });
    }

    // ============================================================
    // SCROLL ANIMATIONS
    // ============================================================
    const header = document.getElementById('header');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const contactsSection = document.getElementById('contacts-section');

    // Threshold in pixels to trigger the animation
    const headerThreshold = 10;

    // Listen for scroll events on the window
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;

        // Step 1: Header Shrink & Initial Text Fade
        if (scrollPosition > headerThreshold) {
            header.classList.add('scrolled');
            if (companyNameEl) companyNameEl.classList.add('hidden');
            if (companyTaglineEl) companyTaglineEl.classList.add('hidden');
            if (scrollIndicator) scrollIndicator.classList.add('hidden');
        } else {
            header.classList.remove('scrolled');
            if (companyNameEl) companyNameEl.classList.remove('hidden');
            if (companyTaglineEl) companyTaglineEl.classList.remove('hidden');
            if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        }

        // Step 2: Contacts Fade In
        if (scrollPosition > headerThreshold) {
            if (contactsSection) contactsSection.classList.add('visible');
        } else {
            if (contactsSection) contactsSection.classList.remove('visible');
        }
    });

    // ============================================================
    // vCARD DOWNLOAD (built from config)
    // ============================================================
    function getContactPhoto() {
        // Dynamically generate square avatar from the page logo
        try {
            const logo = document.getElementById('logo');
            if (logo && logo.complete && logo.naturalWidth > 0) {
                const canvas = document.createElement('canvas');
                const size = 440;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#141414';
                    ctx.fillRect(0, 0, size, size);

                    const w = logo.naturalWidth;
                    const h = logo.naturalHeight;
                    const ratio = w / h;
                    const innerH = 330;
                    let drawW, drawH;
                    if (ratio >= 1) {
                        drawW = Math.min(size - 60, innerH * ratio);
                        drawH = drawW / ratio;
                    } else {
                        drawH = innerH;
                        drawW = drawH * ratio;
                    }
                    const dx = (size - drawW) / 2;
                    const dy = (size - drawH) / 2;

                    ctx.drawImage(logo, dx, dy, drawW, drawH);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    const parts = dataUrl.split(',');
                    if (parts.length === 2 && parts[1].length > 100) {
                        return {
                            data: parts[1],
                            type: 'JPEG'
                        };
                    }
                }
            }
        } catch (err) {
            console.warn('Fallback avatar generation failed:', err);
        }

        return null;
    }

    const saveContactBtn = document.getElementById('btn-save-contact');
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Build social URL lines dynamically
            const socialUrlLines = cfg.socials.map(s =>
                `URL;type=${s.platform}:${s.url}`
            ).join('\r\n');

            const socialProfileLines = cfg.socials.map(s =>
                `X-SOCIALPROFILE;type=${s.platform.toLowerCase()}:${s.url}`
            ).join('\r\n');

            // Build phone number lines dynamically (supports multiple numbers)
            const phoneLines = cfg.contact.phones.map(p =>
                `TEL;TYPE=${p.label.toUpperCase()},VOICE:${p.number}`
            ).join('\r\n');

            const photo = getContactPhoto();
            let photoLine = '';
            if (photo && photo.data) {
                photoLine = `PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.data}`;
            }

            const vcardLines = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                // Company name as the primary display name for the contact
                `FN:${cfg.company.name}`,
                `N:${cfg.company.name};;;;`,
                `ORG:${cfg.company.name}`,
                `TITLE:${cfg.person.fullName} - ${cfg.person.title}`,
                `NOTE:${cfg.vcard.contactNote}`,
            ];

            if (photoLine) {
                vcardLines.push(photoLine);
            }

            if (phoneLines) {
                vcardLines.push(phoneLines);
            }

            vcardLines.push(
                `EMAIL;TYPE=PREF,INTERNET:${cfg.contact.email}`,
                `URL;type=Location:${cfg.contact.locationUrl}`,
                `URL;type=WhatsApp:https://wa.me/${cfg.contact.whatsapp.replace(/[^0-9]/g, '')}`,
                `X-WHATSAPP:+${cfg.contact.whatsapp.replace(/[^0-9]/g, '')}`,
                `IMPP;wa:whatsapp:+${cfg.contact.whatsapp.replace(/[^0-9]/g, '')}`
            );

            if (socialUrlLines) vcardLines.push(socialUrlLines);
            if (socialProfileLines) vcardLines.push(socialProfileLines);

            vcardLines.push(
                `ADR;TYPE=WORK:;;${cfg.vcard.addressStreet};${cfg.vcard.addressCity};${cfg.vcard.addressState};;${cfg.vcard.addressCountry}`,
                'END:VCARD',
                ''
            );

            const vcardContent = vcardLines.filter(line => line.length > 0).join('\r\n');

            const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${cfg.company.name.replace(/\s+/g, '_')}.vcf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        });
    }
});