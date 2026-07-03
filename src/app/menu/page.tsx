import menuDataFallback from '@/data/menu.json';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

// Tell Next.js to NEVER cache this page so it always shows the latest data from Supabase
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function MenuPage() {
  let categories: any[] = [];
  let errorMessage = null;

  try {
    if (supabase) {
      // Fetch categories and products from Supabase
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      const { data: prodData, error: prodError } = await supabase.from('products').select('*');
      
      if (!catError && !prodError && catData) {
        categories = catData.map(cat => ({
          id: cat.id,
          name: cat.name,
          items: prodData?.filter(p => p.category_id === cat.id) || []
        }));
      } else {
        errorMessage = JSON.stringify(catError || prodError);
      }
    } else {
      errorMessage = "Supabase bağlantısı (env) bulunamadı.";
    }
  } catch (error: any) {
    errorMessage = error.message || JSON.stringify(error);
  }

  if (errorMessage) {
    return (
      <div className="container" style={{ paddingTop: '150px', color: 'red', textAlign: 'center' }}>
        <h2>Bağlantı Hatası!</h2>
        <p>Supabase'e bağlanırken bir sorun oluştu (Büyük ihtimalle şifre veya url harf hatası var).</p>
        <p>Hata detayı: {errorMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.menuPage}>
      <div className={styles.menuHeader}>
        <div className="container">
          <h1 className="section-title">Menümüz</h1>
          <p className={styles.menuDescription}>
            Özenle seçilmiş malzemelerle hazırladığımız lezzetleri keşfedin. 
            Sağlıklı seçimler yapabilmeniz için tüm kalori değerleri menümüzde yer almaktadır.
          </p>
        </div>
      </div>

      <div className="container">
        <div className={styles.menuContainer}>
          {categories.map((category: any) => (
            <section key={category.id} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category.name}</h2>
              <div className={styles.itemsGrid}>
                {category.items.map((item: any) => (
                  <div key={item.id} className={styles.menuItem}>
                    {item.image_url && (
                      <div className={styles.itemImageWrapper}>
                        <Image 
                          src={item.image_url} 
                          alt={item.name} 
                          fill 
                          style={{ objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <span className={styles.itemPrice}>{item.price} ₺</span>
                      </div>
                      {item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                      )}
                      <div className={styles.itemFooter}>
                        <span className={styles.itemCalories}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                          {item.calories} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
