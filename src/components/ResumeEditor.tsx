import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ResumeEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const handlePersonalChange = (field: string, value: string) => {
    onChange({
      ...data,
      personal: { ...data.personal, [field]: value }
    });
  };

  const addExperience = () => {
    const newExp = { company: '', role: '', duration: '', description: '' };
    onChange({
      ...data,
      experience: [...data.experience, newExp]
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const removeExperience = (index: number) => {
    const newExp = data.experience.filter((_: any, i: number) => i !== index);
    onChange({ ...data, experience: newExp });
  };

  const addEducation = () => {
    const newEdu = { school: '', degree: '', year: '' };
    onChange({
      ...data,
      education: [...(data.education || []), newEdu]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...(data.education || [])];
    newEdu[index] = { ...newEdu[index], [field]: value };
    onChange({ ...data, education: newEdu });
  };

  const removeEducation = (index: number) => {
    const newEdu = (data.education || []).filter((_: any, i: number) => i !== index);
    onChange({ ...data, education: newEdu });
  };

  return (
    <div className="space-y-8 pb-12">
        {/* Personal Info */}
        <section className="glass-card p-6 rounded-2xl">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-600">Full Name</Label>
              <Input 
                className="bg-white/50 border-black/5 focus:bg-white"
                value={data.personal.name} 
                onChange={(e) => handlePersonalChange('name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Email</Label>
              <Input 
                className="bg-white/50 border-black/5 focus:bg-white"
                value={data.personal.email} 
                onChange={(e) => handlePersonalChange('email', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Phone</Label>
              <Input 
                className="bg-white/50 border-black/5 focus:bg-white"
                value={data.personal.phone} 
                onChange={(e) => handlePersonalChange('phone', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Location</Label>
              <Input 
                className="bg-white/50 border-black/5 focus:bg-white"
                value={data.personal.location} 
                onChange={(e) => handlePersonalChange('location', e.target.value)} 
              />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="glass-card p-6 rounded-2xl">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Professional Summary</h3>
          <Textarea 
            className="min-h-[120px] bg-white/50 border-black/5 focus:bg-white" 
            value={data.summary} 
            onChange={(e) => onChange({ ...data, summary: e.target.value })} 
          />
        </section>

        {/* Experience */}
        <section className="glass-card p-6 rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Work Experience</h3>
            <Button variant="outline" size="sm" onClick={addExperience} className="gap-2 bg-white/50 border-black/5 hover:bg-white">
              <Plus size={14} />
              Add Experience
            </Button>
          </div>
          <div className="space-y-4">
            {data.experience.map((exp: any, i: number) => (
              <Card key={i} className="relative overflow-hidden border-black/5 bg-white/40 shadow-none">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-slate-600">Company</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={exp.company} 
                          onChange={(e) => updateExperience(i, 'company', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600">Role</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={exp.role} 
                          onChange={(e) => updateExperience(i, 'role', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600">Duration</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={exp.duration} 
                          onChange={(e) => updateExperience(i, 'duration', e.target.value)} 
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeExperience(i)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Description</Label>
                    <Textarea 
                      className="min-h-[100px] bg-white/50 border-black/5 focus:bg-white" 
                      value={exp.description} 
                      onChange={(e) => updateExperience(i, 'description', e.target.value)} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="glass-card p-6 rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Education</h3>
            <Button variant="outline" size="sm" onClick={addEducation} className="gap-2 bg-white/50 border-black/5 hover:bg-white">
              <Plus size={14} />
              Add Education
            </Button>
          </div>
          <div className="space-y-4">
            {(data.education || []).map((edu: any, i: number) => (
              <Card key={i} className="relative overflow-hidden border-black/5 bg-white/40 shadow-none">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-slate-600">School/University</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={edu.school} 
                          onChange={(e) => updateEducation(i, 'school', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600">Degree</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={edu.degree} 
                          onChange={(e) => updateEducation(i, 'degree', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600">Year</Label>
                        <Input 
                          className="bg-white/50 border-black/5 focus:bg-white"
                          value={edu.year} 
                          onChange={(e) => updateEducation(i, 'year', e.target.value)} 
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeEducation(i)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="glass-card p-6 rounded-2xl">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Skills</h3>
          <Textarea 
            placeholder="Enter skills separated by commas (e.g. React, TypeScript, Node.js)" 
            className="bg-white/50 border-black/5 focus:bg-white"
            value={data.skills.join(', ')} 
            onChange={(e) => onChange({ ...data, skills: e.target.value.split(',').map((s: string) => s.trim()) })} 
          />
        </section>
      </div>
  );
}
