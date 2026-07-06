import styles from './page.module.css';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container section animate-fade-in">
      <h1 className="section-title">Hakkımızda</h1>
      
      <div className={styles.aboutContainer}>
        <div className={styles.aboutContent}>
          <h2>Lezzetin Köklü Hikayesi</h2>
          <p>
            GurmeIST, İstanbul'un kalbinde, geleneksel Türk mutfağının modern yorumlarıyla
            misafirlerine unutulmaz bir gastronomi deneyimi sunmak amacıyla kuruldu.
          </p>
          <p>
            Şeflerimizin tutkusu ve yaratıcılığıyla şekillenen menümüz, en taze yerel 
            malzemeler kullanılarak özenle hazırlanıyor. Amacımız, her tabakta sadece
            bir yemek değil, bir sanat eseri sunmak.
          </p>
          <p>
            Sağlıklı yaşam bilincinin arttığı günümüzde, şeffaflık ilkemiz gereği menümüzdeki
            tüm lezzetlerin kalori ve içerik değerlerini sizlerle paylaşıyoruz. Böylece,
            hem damak zevkinize hem de sağlıklı yaşam hedeflerinize uygun seçimler
            yapabilirsiniz.
          </p>
        </div>
        
        <div className={styles.aboutImage}>
          <div className={styles.imagePlaceholder}>
            {/* You would place a real image here */}
            <span>Restoran İç Mekan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
