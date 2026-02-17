import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';

export const TermsOfService: React.FC = () => {
   const sections = [
      {
         title: '1. Acceptance of Terms',
         content: [
            {
               text: 'By accessing or using the Arms & Ammo Shop website, creating an account, or making a purchase, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.'
            },
            {
               text: 'We reserve the right to modify these terms at any time. Continued use of the website after changes are posted constitutes acceptance of the revised terms. Material changes will be communicated to registered users via email.'
            }
         ]
      },
      {
         title: '2. Account Registration',
         content: [
            {
               text: 'To access certain features of our website, including purchasing products, you must create an account. You agree to provide accurate, complete, and current information during registration and to keep your account information updated.'
            },
            {
               text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised access or use of your account.'
            },
            {
               subtitle: 'Brand Accounts',
               text: 'Brands who wish to sell gear through Arms & Ammo must apply for a brand account, which is subject to review and approval by our team. Approved brands must comply with all brand-specific guidelines, including accurate representation of their work, timely fulfilment of orders, and adherence to quality standards.'
            }
         ]
      },
      {
         title: '3. Purchasing Products',
         content: [
            {
               subtitle: 'Pricing & Availability',
               text: 'All product prices are listed in Pakistani Rupees (PKR) and may be displayed in other currencies for reference. Prices are subject to change without notice. The availability of products is subject to confirmation by the respective brand.'
            },
            {
               subtitle: 'Order Process',
               text: 'When you place an order, it constitutes an offer to purchase. Your order is confirmed only after the manufacturer verifies availability and we process payment. We reserve the right to refuse or cancel any order at our discretion, including for suspected fraud, pricing errors, or unavailability of product.'
            },
            {
               subtitle: 'Firearms & Gear',
               text: 'Arms & Ammo offers a wide range of firearms, ammunition, and tactical gear. The listing will clearly indicate the specifications and condition of each item. Purchasing an item transfers physical ownership to the buyer, subject to local laws.'
            },
            {
               subtitle: 'Payment',
               text: 'We accept payments through Stripe and bank transfer. All payment processing is handled by our secure third-party payment providers. By providing payment information, you authorise us to charge the total order amount, including product price, applicable shipping fees, and any taxes.'
            }
         ]
      },
      {
         title: '4. Shipping & Delivery',
         content: [
            {
               text: 'Arms & Ammo ships products domestically within Pakistan and internationally. Shipping costs are calculated based on the destination, dimensions, and chosen shipping method. All products are professionally packaged and insured during transit.'
            },
            {
               subtitle: 'Delivery Times',
               text: 'Estimated delivery times vary by destination and shipping method. These estimates are provided as guidelines and are not guaranteed. Arms & Ammo is not liable for delays caused by customs, weather, or carrier issues beyond our control.'
            },
            {
               subtitle: 'Risk of Loss',
               text: 'All products are insured during shipping. Risk of loss or damage transfers to the buyer upon delivery. If your item arrives damaged, please contact us within 48 hours of receipt with photographs documenting the damage, and we will work with you and the shipping insurer to resolve the issue.'
            }
         ]
      },
      {
         title: '5. Returns & Refunds',
         content: [
            {
               text: 'Due to the unique nature of our products, returns are accepted only in the following circumstances:'
            },
            {
               text: '- The product was significantly misrepresented in the listing\n- The product arrived damaged and was reported within 48 hours\n- The wrong item was delivered'
            },
            {
               text: 'For eligible returns, the item must be returned in its original packaging and condition. Return shipping costs may be the responsibility of the buyer unless the return is due to our error. Refunds will be processed within 14 business days of receiving the returned item.'
            },
            {
               text: 'Custom items or ammunition are generally non-refundable unless they arrive damaged or defective.'
            }
         ]
      },
      {
         title: '6. Intellectual Property',
         content: [
            {
               subtitle: 'Brand Rights',
               text: 'All products displayed on Arms & Ammo are the intellectual property of the respective brand or manufacturer. Purchasing an item grants ownership of the physical product only. Copyright, reproduction rights, and all other intellectual property rights remain with the brand unless explicitly transferred in a separate written agreement.'
            },
            {
               subtitle: 'Website Content',
               text: 'The Arms & Ammo website, including its design, text, graphics, logos, and software, is the property of Arms & Ammo Shop and is protected by Pakistani and international intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content on this site without our prior written consent.'
            },
            {
               subtitle: 'Brand Licence',
               text: 'By listing products on Arms & Ammo, brands grant us a non-exclusive, royalty-free licence to display, promote, and market their products on our website, social media, and marketing materials for the duration their items are listed with us.'
            }
         ]
      },
      {
         title: '7. Authenticity Guarantee',
         content: [
            {
               text: 'All products sold through Arms & Ammo are guaranteed authentic. We work directly with manufacturers and verified distributors to ensure the genuineness and quality of every item in our shop.'
            }
         ]
      },
      {
         title: '8. User Conduct',
         content: [
            {
               text: 'By using our website, you agree not to:'
            },
            {
               text: '- Use the site for any unlawful purpose or in violation of any applicable laws\n- Attempt to gain unauthorised access to any part of the website or its systems\n- Upload malicious code, spam, or any content that infringes on the rights of others\n- Misrepresent your identity or impersonate another person\n- Interfere with the proper functioning of the website\n- Scrape, crawl, or use automated tools to extract content from the site without permission\n- Submit fraudulent orders or payment information'
            }
         ]
      },
      {
         title: '9. Limitation of Liability',
         content: [
            {
               text: 'Arms & Ammo Shop acts as a premier marketplace for firearms and gear. While we take every reasonable measure to verify the quality of products listed on our platform, we provide our services on an "as-is" basis.'
            },
            {
               text: 'To the maximum extent permitted by law, Arms & Ammo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, including but not limited to loss of revenue, data, or anticipated profits.'
            },
            {
               text: 'Our total liability for any claim arising from or related to these terms or our services shall not exceed the amount you paid to Arms & Ammo in the twelve months preceding the claim.'
            }
         ]
      },
      {
         title: '10. Dispute Resolution',
         content: [
            {
               text: 'In the event of a dispute between a buyer and a brand regarding a purchase, Arms & Ammo will make reasonable efforts to mediate the issue. However, Arms & Ammo is not a party to the sale agreement between buyers and brands and shall not be held liable for disputes regarding quality or condition beyond what was represented on our platform.'
            }
         ]
      },
      {
         title: '11. Governing Law',
         content: [
            {
               text: 'These Terms of Service are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Lahore, Punjab, Pakistan.'
            }
         ]
      },
      {
         title: '12. Termination',
         content: [
            {
               text: 'We reserve the right to suspend or terminate your account at our discretion if we believe you have violated these terms, engaged in fraudulent activity, or acted in a manner harmful to Arms & Ammo, its users, or its brands. Upon termination, your right to use the services immediately ceases.'
            }
         ]
      },
      {
         title: '13. Contact Us',
         content: [
            {
               text: 'If you have any questions about these Terms of Service, please contact us at:'
            },
            {
               text: 'Arms & Ammo Shop\nDHA Phase 6, Lahore, Punjab, Pakistan\nEmail: legal@armsammo.shop\nPhone: Available upon request'
            }
         ]
      }
   ];

   return (
      <div className="pt-32 pb-20 min-h-screen bg-void">
         <div className="max-w-4xl mx-auto px-6 md:px-12">
            {/* Back Link */}
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.4 }}
            >
               <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-warm-gray hover:text-tangerine text-xs uppercase tracking-widest transition-colors mb-8"
               >
                  <ArrowLeft size={14} />
                  Back to Home
               </Link>
            </motion.div>

            {/* Header */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
               className="mb-12 border-b border-pearl/10 pb-8"
            >
               <div className="flex items-center gap-3 mb-3">
                  <FileText className="text-tangerine" size={28} />
                  <h1 className="font-display text-4xl md:text-5xl text-pearl uppercase tracking-tighter">
                     Terms of Service
                  </h1>
               </div>
               <p className="text-warm-gray text-sm font-mono mt-2 uppercase tracking-wide">
                  Last Updated: January 2025
               </p>
               <p className="text-warm-gray mt-6 leading-relaxed">
                  Welcome to Arms & Ammo Shop. These Terms of Service govern your use of our website and services. By using Arms & Ammo, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
               </p>
            </motion.div>

            {/* Sections */}
            <div className="space-y-10">
               {sections.map((section, idx) => (
                  <motion.div
                     key={idx}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5, delay: idx * 0.05 }}
                  >
                     <h2 className="font-display text-2xl text-pearl mb-4 uppercase tracking-wide">{section.title}</h2>
                     <div className="space-y-4">
                        {section.content.map((item, i) => (
                           <div key={i}>
                              {item.subtitle && (
                                 <h3 className="text-tangerine text-sm uppercase tracking-widest font-bold mb-2">
                                    {item.subtitle}
                                 </h3>
                              )}
                              {item.text && (
                                 <p className="text-warm-gray leading-relaxed text-sm whitespace-pre-line">
                                    {item.text}
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </div>
   );
};
