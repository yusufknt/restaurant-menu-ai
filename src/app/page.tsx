import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image 
            src="/hero.jpg" 
            alt="GurmeIST Restoran İç Mekan" 
            fill
            priority
            style={{ objectFit: "cover" }}
          />
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={`container ${styles.heroContent}`}>
          <h1 className="animate-fade-in">Lezzetin Sanatla<br/>Buluştuğu Nokta</h1>
          <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Şeflerimizin özenle hazırladığı, hem göze hem damağa hitap eden 
            benzersiz menümüzü keşfedin. Artık tüm kalori değerleri şeffaf bir şekilde sizinle.
          </p>
          <div className={styles.heroButtons + " animate-fade-in"} style={{ animationDelay: '0.4s' }}>
            <Link href="/menu" className="btn btn-primary">
              Menüyü İncele
            </Link>
            <Link href="/iletisim" className="btn btn-outline">
              Rezervasyon Yap
            </Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Neden GurmeIST?</h2>
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Şeffaf Bilgi</h3>
            <p>Yeni yönetmeliklere uygun olarak, menümüzdeki her bir yemeğin kalori ve içerik değerlerini görebilirsiniz.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Taze Malzemeler</h3>
            <p>Sadece günlük ve en taze malzemeleri kullanarak sizin için en kaliteli lezzetleri üretiyoruz.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Premium Atmosfer</h3>
            <p>Sıcak, samimi ama bir o kadar da lüks atmosferimizde sevdiklerinizle unutulmaz anlar yaşayın.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
