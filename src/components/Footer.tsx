import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.footerBrand}>
          <h3>GURME<span>IST</span></h3>
          <p>İstanbul'un kalbinde, eşsiz lezzetler ve unutulmaz anılar için özenle tasarlanmış bir gastronomi deneyimi.</p>
        </div>
        
        <div className={styles.footerLinks}>
          <h4>Hızlı Bağlantılar</h4>
          <ul>
            <li><Link href="/">Ana Sayfa</Link></li>
            <li><Link href="/menu">Menü</Link></li>
            <li><Link href="/hakkimizda">Hakkımızda</Link></li>
            <li><Link href="/iletisim">İletişim</Link></li>
          </ul>
        </div>
        
        <div className={styles.footerContact}>
          <h4>İletişim</h4>
          <address>
            <p>Kadıköy Moda Caddesi No:1</p>
            <p>İstanbul, Türkiye</p>
            <p>Tel: +90 (555) 123 45 67</p>
            <p>E-posta: info@gurmeist.com</p>
          </address>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <div className="container">
          <p>&copy; {currentYear} GurmeIST. Tüm hakları saklıdır. Kalori bilgileri yaklaşık değerlerdir.</p>
        </div>
      </div>
    </footer>
  );
}
