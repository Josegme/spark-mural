/**
 * PICKEVENT - Contacto
 * Página de contacto directo con WhatsApp y email.
 */

import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, MessageCircle, ArrowRight, Clock, MapPin } from 'lucide-react';
import whatsappQR from '@/assets/whatsapp-qr.png';

const WHATSAPP_NUMBER = '+54 9 3764 60-6205';
const WHATSAPP_LINK = 'https://wa.me/5493764606205?text=Hola!%20Me%20gustaría%20saber%20más%20sobre%20PickEvent';
const EMAIL = 'hola@pickevent.site';

export default function ContactoPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              Hablemos
            </div>
            <h1 className="text-fluid-4xl lg:text-6xl font-display font-bold tracking-tight">
              Estamos para <span className="text-gradient-primary">ayudarte</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              ¿Sos un salón, organizador o empresa? ¿Tenés dudas sobre planes,
              precios o integraciones? Contactanos directamente y te respondemos
              en menos de 24 hs.
            </p>
          </div>
        </div>
      </section>

      {/* Canales de contacto */}
      <section className="pb-20">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <Card className="border-2 border-primary/30 hover:border-primary transition-colors overflow-hidden">
              <CardContent className="p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                    <Phone className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">La forma más rápida</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Hablá directamente con el equipo. Respondemos consultas comerciales,
                  soporte técnico y armamos propuestas a medida.
                </p>
                <div className="space-y-2">
                  <p className="font-medium">{WHATSAPP_NUMBER}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Lunes a Sábado · 9:00 a 21:00 hs (GMT-3)
                  </p>
                </div>
                <Button size="lg" className="w-full btn-hero gap-3" asChild>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    <Phone className="w-5 h-5" />
                    Abrir WhatsApp
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
                <div className="flex justify-center pt-2">
                  <div className="p-3 bg-white rounded-xl shadow-md border">
                    <img src={whatsappQR} alt="QR WhatsApp PickEvent" className="w-32 h-32" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email + info */}
            <div className="space-y-6">
              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                      <Mail className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl">Email</h3>
                      <p className="text-sm text-muted-foreground">Para consultas formales</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Para propuestas, presupuestos detallados o consultas legales.
                  </p>
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={`mailto:${EMAIL}`}>
                      <Mail className="w-4 h-4" />
                      {EMAIL}
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                      <MapPin className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl">¿Sos salón u organizador?</h3>
                      <p className="text-sm text-muted-foreground">Servicio especial</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Tenemos planes a medida con comisiones, eventos ilimitados y soporte
                    dedicado. Conocé las propuestas:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/para-salones">Para Salones</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/para-organizadores">Organizadores</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
