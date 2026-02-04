import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
   const sections = [
      {
         title: '1. Information We Collect',
         content: [
            {
               subtitle: 'Personal Information',
               text: 'When you create an account, make a purchase, or contact us, we may collect your name, email address, phone number, shipping address, billing address, and payment information.'
            },
            {
               subtitle: 'Artist Information',
               text: 'If you register as an artist, we additionally collect your biography, portfolio URL, city of origin, and artwork details including images, descriptions, dimensions, and pricing.'
            },
            {
               subtitle: 'Browsing Data',
               text: 'We automatically collect information about your device and browsing activity, including IP address, browser type, pages visited, time spent on the site, and referring URLs.'
            },
            {
               subtitle: 'Transaction Data',
               text: 'We record purchase history, order details, shipping preferences, and payment transaction records to process and fulfil your orders.'
            }
         ]
      },
      {
         title: '2. How We Use Your Information',
         content: [
            {
               text: 'We use the information we collect to:'
            },
            {
               text: '- Process and fulfil artwork purchases and shipping arrangements\n- Manage your account and provide customer support\n- Communicate order updates, shipping notifications, and artist confirmations\n- Curate and personalise your gallery browsing experience\n- Send exhibition announcements and newsletter updates (with your consent)\n- Verify artist identities and approve artist accounts\n- Process payments securely through our third-party payment providers\n- Improve our website, services, and overall user experience\n- Comply with legal obligations and protect against fraud'
            }
         ]
      },
      {
         title: '3. Data Sharing & Third Parties',
         content: [
            {
               subtitle: 'Payment Processors',
               text: 'We use Stripe and other secure payment gateways to process transactions. Your payment card information is handled directly by these processors and is encrypted using industry-standard SSL/TLS encryption. We do not store your full credit card details on our servers.'
            },
            {
               subtitle: 'Shipping Partners',
               text: 'We share your shipping address and contact details with our logistics partners to deliver purchased artworks safely and securely.'
            },
            {
               subtitle: 'Artists',
               text: 'When you purchase an artwork, relevant order information is shared with the artist to confirm availability and coordinate fulfilment.'
            },
            {
               subtitle: 'Service Providers',
               text: 'We may share data with trusted service providers who assist us with email communications, image hosting (Cloudinary), analytics, and website maintenance. These providers are contractually obligated to protect your information.'
            },
            {
               text: 'We do not sell, rent, or trade your personal information to third parties for marketing purposes.'
            }
         ]
      },
      {
         title: '4. Intellectual Property & Artwork',
         content: [
            {
               text: 'All artworks displayed on Muraqqa remain the intellectual property of the respective artists. Purchasing an artwork grants you ownership of the physical piece but does not transfer copyright or reproduction rights unless explicitly agreed upon in writing.'
            },
            {
               text: 'Images, descriptions, and other content on this website are protected by copyright. Viewing or purchasing artwork from Muraqqa grants only a limited, personal, non-commercial licence. Reproduction, distribution, or creation of derivative works from any content on this site without prior written permission is prohibited.'
            }
         ]
      },
      {
         title: '5. Cookies & Tracking',
         content: [
            {
               text: 'We use cookies and similar technologies to maintain your session, remember your preferences, and improve our services. Essential cookies are required for the site to function properly. Analytics cookies help us understand how visitors use our site.'
            },
            {
               text: 'You may manage cookie preferences through your browser settings. Disabling cookies may affect certain features of the website.'
            }
         ]
      },
      {
         title: '6. Data Security',
         content: [
            {
               text: 'We implement industry-standard security measures to protect your personal information, including SSL/TLS encryption for data in transit, secure server infrastructure, and access controls for sensitive data. Payment processing adheres to PCI-DSS compliance standards.'
            },
            {
               text: 'While we take every reasonable precaution to protect your data, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security of your information.'
            }
         ]
      },
      {
         title: '7. Your Rights',
         content: [
            {
               text: 'Depending on your location, you may have the following rights regarding your personal data:'
            },
            {
               text: '- Access: Request a copy of the personal information we hold about you\n- Correction: Request that we update or correct inaccurate information\n- Deletion: Request that we delete your personal data, subject to legal retention requirements\n- Opt-out: Unsubscribe from marketing communications at any time\n- Data Portability: Request your data in a structured, machine-readable format'
            },
            {
               text: 'To exercise any of these rights, please contact us at privacy@muraqqa.art.'
            }
         ]
      },
      {
         title: '8. Data Retention',
         content: [
            {
               text: 'We retain your personal information for as long as necessary to fulfil the purposes outlined in this policy, maintain your account, process transactions, and comply with legal obligations. Transaction records may be retained for up to seven years for tax and accounting purposes under Pakistani law.'
            }
         ]
      },
      {
         title: '9. Children\'s Privacy',
         content: [
            {
               text: 'Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us and we will promptly delete such information.'
            }
         ]
      },
      {
         title: '10. Changes to This Policy',
         content: [
            {
               text: 'We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify registered users of material changes via email. The "Last Updated" date at the top of this page indicates the most recent revision.'
            }
         ]
      },
      {
         title: '11. Contact Us',
         content: [
            {
               text: 'If you have any questions about this Privacy Policy or how we handle your data, please contact us at:'
            },
            {
               text: 'Muraqqa Art Gallery\nDHA Phase 6, Lahore, Punjab, Pakistan\nEmail: privacy@muraqqa.art\nPhone: Available upon request'
            }
         ]
      }
   ];

   return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-950">
         <div className="max-w-4xl mx-auto px-6 md:px-12">
            {/* Back Link */}
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.4 }}
            >
               <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-stone-500 hover:text-amber-500 text-xs uppercase tracking-widest transition-colors mb-8"
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
               className="mb-12 border-b border-stone-800/50 pb-8"
            >
               <div className="flex items-center gap-3 mb-3">
                  <Shield className="text-amber-500" size={28} />
                  <h1 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                     Privacy Policy
                  </h1>
               </div>
               <p className="text-stone-500 text-sm">
                  Last Updated: January 2025
               </p>
               <p className="text-stone-400 mt-4 leading-relaxed">
                  At Muraqqa Art Gallery, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, create an account, or make a purchase.
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
                     <h2 className="font-serif text-2xl text-white mb-4">{section.title}</h2>
                     <div className="space-y-4">
                        {section.content.map((item, i) => (
                           <div key={i}>
                              {item.subtitle && (
                                 <h3 className="text-amber-500/80 text-sm uppercase tracking-widest font-medium mb-2">
                                    {item.subtitle}
                                 </h3>
                              )}
                              {item.text && (
                                 <p className="text-stone-400 leading-relaxed text-sm whitespace-pre-line">
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
