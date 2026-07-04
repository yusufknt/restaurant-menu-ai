import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_IDS;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function handlePhotoUpload(chatId: number, photo: any, productId: string, productName: string) {
  if (!supabase) return false;
  try {
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${photo.file_id}`);
    const fileData = await fileRes.json();
    
    if (fileData.ok) {
      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      
      const imgRes = await fetch(fileUrl);
      const imgBlob = await imgRes.blob();
      const fileName = `${productId}-${Date.now()}.jpg`;

      const { data: storageData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imgBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        await sendMessage(chatId, `Fotoğraf yüklenemedi: ${uploadError.message}`);
        return false;
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${fileName}`;
      
      const { error: dbError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId);

      if (dbError) {
        await sendMessage(chatId, `Veritabanı güncellenemedi: ${dbError.message}`);
        return false;
      } else {
        await sendMessage(chatId, `📸 ${productName} fotoğrafı başarıyla eklendi/güncellendi!`);
        return true;
      }
    }
  } catch (err: any) {
    await sendMessage(chatId, `Fotoğraf yüklenirken hata oluştu: ${err.message}`);
  }
  return false;
}

async function parseMessageWithGemini(text: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in env.");
    return { error: "GEMINI_API_KEY Vercel üzerinde tanımlı değil veya henüz aktif olmamış (Yeniden Dağıtım/Redeploy yapılmamış olabilir)." };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Aşağıdaki Türkçe metni analiz et ve restorandaki menü yönetim eylemini belirle. 
Metin: "${text}"

Eylemler:
1. UPDATE_PRICE: Bir ürünün fiyatını günceller. (Örn: "latte fiyatını 180 yap", "Kola 45 TL olsun")
2. DELETE_PRODUCT: Menüden bir ürünü siler. (Örn: "menüden americano'yu kaldır", "sufleyi sil")
3. ADD_PRODUCT: Menüye yeni ürün ekler. (Örn: "menüye latte ekle fiyatı 250 olsun", "icecekler kategorisine ayran ekle fiyatı 30 kalori 80")
4. UNKNOWN: Eğer metin menü güncellemeyle alakalı değilse veya anlaşılmıyorsa.

Önemli Kurallar:
- "productName" alanında ürünün ek almamış, yalın haldeki ismini döndür. Kelime sonlarındaki Türkçe yönelme, belirtme veya iyelik eklerini (-i, -yi, -yi, -sini, -u, -nü vb.) mutlaka temizle. Örneğin:
  * "köz patlıcan ezmesini 150 yap" -> "Köz Patlıcan Ezmesi"
  * "latteyi 90 lira yap" -> "Latte"
  * "kola fiyatını 45 tl yap" -> "Kola"
  * "sufleyi sil" -> "Sufle"
- "price" alanı sadece sayı (float/integer) olmalıdır. Lira, TL, ₺ gibi para birimi kelimelerini veya sembollerini tamamen temizle. Örneğin: "150 lira" -> 150, "90 TL" -> 90.
- ADD_PRODUCT eyleminde kategori id'leri şunlardan biri olmalıdır: "tadim", "vejetaryen", "tatli", "icecekler". Eğer kategori belirtilmediyse, tahmin etmeye çalış veya varsayılan olarak en uygununu seç (örneğin kahve/limonata/kola/çay ise "icecekler", tatlılar ise "tatli", ana yemek ise "tadim", salatalar/sebzeli yemekler ise "vejetaryen" seç).
`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["UPDATE_PRICE", "DELETE_PRODUCT", "ADD_PRODUCT", "UNKNOWN"]
                },
                productName: { type: "string", description: "Ürünün ek almamış, yalın haldeki ismi (kelime başları büyük harf olmalı, Örn: Köz Patlıcan Ezmesi)" },
                price: { type: "number", description: "Varsa ürünün fiyatı (sadece sayı)" },
                category: { type: "string", description: "ADD_PRODUCT için kategori id'si: tadim, vejetaryen, tatli, icecekler" },
                calories: { type: "number", description: "Varsa kalori değeri" },
                description: { type: "string", description: "Varsa ürünün açıklaması" }
              },
              required: ["action"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error status:", response.status, errText);
      return { error: `Gemini API hatası (Durum: ${response.status}): ${errText.substring(0, 150)}` };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText) {
      return JSON.parse(resultText);
    }
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    return { error: `Gemini API çağrı hatası: ${error.message || error}` };
  }
  return { error: "Gemini API yanıtı ayrıştırılamadı." };
}

export async function POST(req: Request) {
  if (!supabase) {
    console.error("Supabase istemcisi başlatılamadı (.env eksik olabilir).");
    return NextResponse.json({ status: 'error', message: 'Database not initialized' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.chat) {
      return NextResponse.json({ status: 'ok' });
    }

    const chatId = message.chat.id;

    // Security check: Temporarily disabled for troubleshooting
    /*
    const allowedIds = ALLOWED_CHAT_ID ? ALLOWED_CHAT_ID.split(',').map(id => id.trim().replace(/^['"]|['"]$/g, '')) : [];
    console.log("Debug Webhook Access:", { incomingChatId: chatId.toString(), allowedIds, rawEnv: ALLOWED_CHAT_ID });
    if (!allowedIds.includes(chatId.toString())) {
      await sendMessage(chatId, "Yetkisiz erişim. Bu botu kullanma yetkiniz yok.");
      return NextResponse.json({ status: 'ok' });
    }
    */

    const text = message.text || message.caption || '';

    // 1. Natural Language processing with Gemini (runs if text doesn't start with '/')
    if (text && !text.startsWith('/')) {
      const parsed = await parseMessageWithGemini(text);
      
      if (parsed) {
        if ('error' in parsed) {
          await sendMessage(chatId, `⚠️ Yapay zeka modülü çalışırken bir hata oluştu:\n${parsed.error}`);
          return NextResponse.json({ status: 'ok' });
        }

        if (parsed.action !== 'UNKNOWN') {
        const { action, productName, price, category, calories, description } = parsed;

        if (action === 'UPDATE_PRICE') {
          if (!productName || price === undefined) {
            await sendMessage(chatId, "⚠️ Güncellemek istediğiniz ürün adını veya yeni fiyatı anlayamadım.");
            return NextResponse.json({ status: 'ok' });
          }

          const { data: searchData, error: searchError } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${productName}%`);

          if (searchError) {
            await sendMessage(chatId, `Hata oluştu: ${searchError.message}`);
          } else if (!searchData || searchData.length === 0) {
            await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı.`);
          } else if (searchData.length > 1) {
            const isimler = searchData.map(item => item.name).join(', ');
            await sendMessage(chatId, `⚠️ Birden fazla ürün bulundu: ${isimler}.\nLütfen hangisi olduğunu daha net yazın.`);
          } else {
            const targetProduct = searchData[0];
            const { error: updateError } = await supabase
              .from('products')
              .update({ price })
              .eq('id', targetProduct.id);
              
            if (updateError) {
              await sendMessage(chatId, `Güncelleme hatası: ${updateError.message}`);
            } else {
              await sendMessage(chatId, `✅ ${targetProduct.name} fiyatı ${price} ₺ olarak güncellendi!`);
              if (message.photo) {
                const photo = message.photo[message.photo.length - 1];
                await handlePhotoUpload(chatId, photo, targetProduct.id, targetProduct.name);
              }
            }
          }
          return NextResponse.json({ status: 'ok' });
        }

        if (action === 'DELETE_PRODUCT') {
          if (!productName) {
            await sendMessage(chatId, "⚠️ Silmek istediğiniz ürün adını anlayamadım.");
            return NextResponse.json({ status: 'ok' });
          }

          const { data: searchData, error: searchError } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${productName}%`);

          if (searchError) {
            await sendMessage(chatId, `Hata oluştu: ${searchError.message}`);
          } else if (!searchData || searchData.length === 0) {
            await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı.`);
          } else if (searchData.length > 1) {
            const isimler = searchData.map(item => item.name).join(', ');
            await sendMessage(chatId, `⚠️ Birden fazla ürün bulundu: ${isimler}.\nLütfen hangisi olduğunu daha net yazın.`);
          } else {
            const targetProduct = searchData[0];
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', targetProduct.id);

            if (deleteError) {
              await sendMessage(chatId, `Silme hatası: ${deleteError.message}`);
            } else {
              await sendMessage(chatId, `🗑️ ${targetProduct.name} menüden silindi!`);
            }
          }
          return NextResponse.json({ status: 'ok' });
        }

        if (action === 'ADD_PRODUCT') {
          if (!productName || price === undefined) {
            await sendMessage(chatId, "⚠️ Eklenecek ürünün adını veya fiyatını anlayamadım. Örnek: 'menüye ayran ekle fiyatı 30 olsun'");
            return NextResponse.json({ status: 'ok' });
          }

          // Generate ID from name safely by replacing Turkish characters
          const id = productName.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          const finalCategory = category || 'icecekler';

          const { error } = await supabase.from('products').insert({
            id,
            category_id: finalCategory,
            name: productName,
            price: price,
            calories: calories || 0,
            description: description || null
          });

          if (error) {
            await sendMessage(chatId, `Ekleme hatası: ${error.message}`);
          } else {
            await sendMessage(chatId, `➕ ${productName} başarıyla menüye eklendi!`);
            if (message.photo) {
              const photo = message.photo[message.photo.length - 1];
              await handlePhotoUpload(chatId, photo, id, productName);
            }
          }
          return NextResponse.json({ status: 'ok' });
        }
      }
    }
  }

    // 2. Fallback to Slash Commands (for backwards compatibility / backup)
    // Command: /fiyat
    if (text.startsWith('/fiyat')) {
      const parts = text.replace('/fiyat', '').trim().split(' ');
      const newPrice = parts.pop();
      const productName = parts.join(' ').trim();
      
      if (!newPrice || !productName) {
        await sendMessage(chatId, "Hatalı format. Kullanım: /fiyat Kola 40");
        return NextResponse.json({ status: 'ok' });
      }

      const { data: searchData, error: searchError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`);

      if (searchError) {
        await sendMessage(chatId, `Hata oluştu: ${searchError.message}`);
      } else if (!searchData || searchData.length === 0) {
        await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı.`);
      } else if (searchData.length > 1) {
        const isimler = searchData.map(item => item.name).join(', ');
        await sendMessage(chatId, `⚠️ Birden fazla ürün bulundu: ${isimler}.\nLütfen hangisi olduğunu daha net yazın (Örn: /fiyat ${searchData[0].name} ${newPrice})`);
      } else {
        const targetProduct = searchData[0];
        const { error: updateError } = await supabase
          .from('products')
          .update({ price: parseFloat(newPrice) })
          .eq('id', targetProduct.id);
          
        if (updateError) {
          await sendMessage(chatId, `Güncelleme hatası: ${updateError.message}`);
        } else {
          await sendMessage(chatId, `✅ ${targetProduct.name} fiyatı ${newPrice} ₺ olarak güncellendi!`);
        }
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Command: /sil
    if (text.startsWith('/sil')) {
      const productName = text.replace('/sil', '').trim();
      
      const { data: searchData, error: searchError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`);

      if (searchError) {
        await sendMessage(chatId, `Hata oluştu: ${searchError.message}`);
      } else if (!searchData || searchData.length === 0) {
        await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı.`);
      } else if (searchData.length > 1) {
        const isimler = searchData.map(item => item.name).join(', ');
        await sendMessage(chatId, `⚠️ Birden fazla ürün bulundu: ${isimler}.\nLütfen hangisi olduğunu daha net yazın (Örn: /sil ${searchData[0].name})`);
      } else {
        const targetProduct = searchData[0];
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', targetProduct.id);

        if (deleteError) {
          await sendMessage(chatId, `Silme hatası: ${deleteError.message}`);
        } else {
          await sendMessage(chatId, `🗑️ ${targetProduct.name} menüden silindi!`);
        }
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Command: /ekle
    if (text.startsWith('/ekle')) {
      const content = text.replace('/ekle', '').trim();
      const parts = content.split(',').map((p: string) => p.trim());
      
      if (parts.length < 4) {
        await sendMessage(chatId, "Hatalı format. Kullanım: /ekle icecekler, Ayran, 20, 50, Yayık ayranı");
        return NextResponse.json({ status: 'ok' });
      }

      const id = parts[1].toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase.from('products').insert({
        id,
        category_id: parts[0],
        name: parts[1],
        price: parseFloat(parts[2]),
        calories: parseInt(parts[3]),
        description: parts[4] || null
      });

      if (error) {
        await sendMessage(chatId, `Hata oluştu: ${error.message}`);
      } else {
        await sendMessage(chatId, `➕ ${parts[1]} başarıyla menüye eklendi!`);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Handle Photos (Fallback)
    if (message.photo && message.caption) {
      const productName = message.caption.trim();
      
      const { data: searchData, error: searchError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`);

      if (searchError || !searchData || searchData.length === 0) {
        await sendMessage(chatId, `❌ "${productName}" isminde bir ürün bulunamadı. Fotoğraf yüklenmedi.`);
        return NextResponse.json({ status: 'ok' });
      } else if (searchData.length > 1) {
        const isimler = searchData.map(item => item.name).join(', ');
        await sendMessage(chatId, `⚠️ Birden fazla ürün bulundu: ${isimler}.\nLütfen resmi tekrar atıp açıklama kısmına daha belirgin bir isim yazın.`);
        return NextResponse.json({ status: 'ok' });
      }

      const targetProduct = searchData[0];
      const photo = message.photo[message.photo.length - 1];
      await handlePhotoUpload(chatId, photo, targetProduct.id, targetProduct.name);
      return NextResponse.json({ status: 'ok' });
    }

    // Default response
    await sendMessage(chatId, "Merhaba! Ben yapay zeka destekli menü yönetim botuyum.\n\n" +
                           "Doğal dille menüyü güncelleyebilirim. Örnek komutlar:\n" +
                           "- \"Latte fiyatını 180 TL yap.\"\n" +
                           "- \"Menüden Americano'yu sil.\"\n" +
                           "- \"Menüye Frambuazlı Cheesecake ekle, fiyatı 190 TL olsun, kalori 340\" (Ayrıca bu mesaja fotoğraf ekleyerek gönderebilirsiniz!)\n\n" +
                           "Alternatif olarak klasik komutları kullanabilirsiniz:\n" +
                           "- /fiyat Ürün Fiyat\n" +
                           "- /sil Ürün\n" +
                           "- /ekle KategoriId, İsim, Fiyat, Kalori");
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
