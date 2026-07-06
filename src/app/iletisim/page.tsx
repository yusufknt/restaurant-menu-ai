import styles from './page.module.css';

export default function ContactPage() {
  return (
    <div className="container section animate-fade-in">
      <h1 className="section-title">İletişim & Rezervasyon</h1>
      
      <div className={styles.contactContainer}>
        <div className={styles.contactInfo}>
          <div className={styles.infoBlock}>
            <h3>Adres</h3>
            <p>Kadıköy Moda Caddesi No:1<br/>İstanbul, Türkiye</p>
          </div>
          
          <div className={styles.infoBlock}>
            <h3>İletişim Bilgileri</h3>
            <p><strong>Telefon:</strong> +90 (555) 123 45 67</p>
            <p><strong>E-posta:</strong> info@gurmeist.com</p>
          </div>
          
          <div className={styles.infoBlock}>
            <h3>Çalışma Saatleri</h3>
            <p>Pazartesi - Pazar: 12:00 - 23:30</p>
          </div>
        </div>
        
        <div className={styles.contactForm}>
          <h3>Rezervasyon Talebi</h3>
          <p className={styles.formNote}>Lütfen rezervasyon talebinizi iletin. Müsaitlik durumuna göre size dönüş yapacağız.</p>
          
          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Ad Soyad</label>
              <input type="text" id="name" required placeholder="Adınız Soyadınız" />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="phone">Telefon Numarası</label>
              <input type="tel" id="phone" required placeholder="0555 123 45 67" />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="date">Tarih</label>
                <input type="date" id="date" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="time">Saat</label>
                <input type="time" id="time" required />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="guests">Kişi Sayısı</label>
              <select id="guests" required>
                <option value="1">1 Kişi</option>
                <option value="2">2 Kişi</option>
                <option value="3">3 Kişi</option>
                <option value="4">4 Kişi</option>
                <option value="5+">5+ Kişi</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Talep Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
