-- Inserindo ou atualizando a descrição padrão da propriedade para que a Landing Page tenha conteúdo
INSERT INTO property_description (
    id, 
    main_text, 
    main_media, 
    rooms_text, 
    location_text, 
    location_media, 
    amenities_text, 
    rules_text
) VALUES (
    'default',
    'Conforto e Praticidade para sua Vida Acadêmica e Profissional\nA MoronaVila oferece o ambiente ideal para quem busca foco nos estudos e tranquilidade no dia a dia, com infraestrutura completa e localização privilegiada.',
    ARRAY['https://images.pexels.com/photos/5935228/pexels-photo-5935228.jpeg']::text[],
    'Nossas acomodações foram pensadas para o máximo aproveitamento de espaço e conforto. Cada quarto é entregue mobiliado e pronto para morar, em uma casa com áreas comuns amplas e equipadas.',
    'Localizada estrategicamente próxima aos principais centros universitários e polos de transporte, facilitando seu deslocamento diário.',
    ARRAY['https://ogimg.infoglobo.com.br/in/24235475-bd5-3f6/FT1086A/thumbnail_IMG_8718.jpg']::text[],
    'Internet de alta velocidade, cozinha compartilhada totalmente equipada, lavanderia e limpeza semanal das áreas comuns inclusas no valor do aluguel.',
    'Prezamos pela convivência harmoniosa. Silêncio após as 22h, respeito aos espaços comuns e colaboração mútua são os pilares da nossa comunidade.'
)
ON CONFLICT (id) DO UPDATE SET
    main_text = EXCLUDED.main_text,
    main_media = EXCLUDED.main_media,
    rooms_text = EXCLUDED.rooms_text,
    location_text = EXCLUDED.location_text,
    location_media = EXCLUDED.location_media,
    amenities_text = EXCLUDED.amenities_text,
    rules_text = EXCLUDED.rules_text,
    updated_at = now();