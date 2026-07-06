import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.logo}>
          <Link href="/">
            GURME<span>IST</span>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <Link href="/" className={styles.navLink}>Ana Sayfa</Link>
            </li>
            <li>
              <Link href="/menu" className={styles.navLink}>Menü</Link>
            </li>
            <li>
              <Link href="/hakkimizda" className={styles.navLink}>Hakkımızda</Link>
            </li>
            <li>
              <Link href="/iletisim" className={styles.navLink}>İletişim</Link>
            </li>
          </ul>
        </nav>
        
        <div className={styles.mobileMenuButton}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  );
}
