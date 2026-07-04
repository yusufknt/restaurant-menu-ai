import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_IDS;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
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

    // Security check: Only allow specific user(s)
    if (chatId.toString() !== ALLOWED_CHAT_ID) {
      await sendMessage(chatId, "Yetkisiz erişim. Bu botu kullanma yetkiniz yok.");
      return NextResponse.json({ status: 'ok' });
    }

    const text = message.text || message.caption || '';
    
    // Command: /fiyat
    if (text.startsWith('/fiyat')) {
      const parts = text.replace('/fiyat', '').trim().split(' ');
      const newPrice = parts.pop();
      const productName = parts.join(' ').trim();
      
      if (!newPrice || !productName) {
        await sendMessage(chatId, "Hatalı format. Kullanım: /fiyat Kola 40");
        return NextResponse.json({ status: 'ok' });
      }

      const { data, error } = await supabase
        .from('products')
        .update({ price: parseFloat(newPrice) })
        .ilike('name', `%${productName}%`) // Partial match
        .select();

      if (error) {
        await sendMessage(chatId, `Hata oluştu: ${error.message}`);
      } else if (!data || data.length === 0) {
        await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı. Lütfen tam veya benzer ismini yazın.`);
      } else {
        await sendMessage(chatId, `✅ ${data[0].name} fiyatı ${newPrice} ₺ olarak güncellendi!`);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Command: /sil
    if (text.startsWith('/sil')) {
      const productName = text.replace('/sil', '').trim();
      
      const { data, error } = await supabase
        .from('products')
        .delete()
        .ilike('name', `%${productName}%`)
        .select();

      if (error) {
        await sendMessage(chatId, `Hata oluştu: ${error.message}`);
      } else if (!data || data.length === 0) {
        await sendMessage(chatId, `❌ Menüde "${productName}" ismini içeren bir ürün bulunamadı.`);
      } else {
        await sendMessage(chatId, `🗑️ ${data[0].name} menüden silindi!`);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Command: /ekle
    if (text.startsWith('/ekle')) {
      // Format: /ekle categoryId, Name, Price, Calories, Description
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

    // Handle Photos
    if (message.photo && message.caption) {
      const productName = message.caption.trim();
      const photo = message.photo[message.photo.length - 1]; // get highest resolution
      
      // 1. Get file path from Telegram
      const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${photo.file_id}`);
      const fileData = await fileRes.json();
      
      if (fileData.ok) {
        const filePath = fileData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        
        // 2. Download image
        const imgRes = await fetch(fileUrl);
        const imgBlob = await imgRes.blob();
        const fileName = `${productName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;

        // 3. Upload to Supabase Storage
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, imgBlob, { contentType: 'image/jpeg' });

        if (uploadError) {
          await sendMessage(chatId, `Fotoğraf yüklenemedi: ${uploadError.message}`);
          return NextResponse.json({ status: 'ok' });
        }

        // 4. Update Product in DB
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${fileName}`;
        
        const { error: dbError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .ilike('name', productName);

        if (dbError) {
          await sendMessage(chatId, `Veritabanı güncellenemedi: ${dbError.message}`);
        } else {
          await sendMessage(chatId, `📸 ${productName} fotoğrafı başarıyla eklendi/güncellendi!`);
        }
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Default response
    await sendMessage(chatId, "Merhaba! Ben menü yönetim botuyum.\nKomutlar:\n- /fiyat Ürün Fiyat\n- /sil Ürün\n- /ekle KategoriId, İsim, Fiyat, Kalori\n- Fotoğraf atıp altına ürün ismi yazarak resim güncelleyebilirsiniz.");
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
