export interface WinFormsFile {
  id: string;
  name: string;
  category: 'Forms' | 'Services' | 'Models' | 'Database' | 'Program';
  description: string;
  code: string;
}

export const WINFORMS_PROJECT_FILES: WinFormsFile[] = [
  {
    id: 'program-cs',
    name: 'Program.cs',
    category: 'Program',
    description: 'C# .NET Windows Forms Giriş Noktası',
    code: `using System;
using System.Windows.Forms;

namespace KocYonetimSistemi
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FrmMain());
        }
    }
}`
  },
  {
    id: 'frm-main-cs',
    name: 'FrmMain.cs',
    category: 'Forms',
    description: 'Ana Yönetim Formu ve Dashboard',
    code: `using System;
using System.Windows.Forms;

namespace KocYonetimSistemi
{
    public partial class FrmMain : Form
    {
        public FrmMain()
        {
            InitializeComponent();
        }

        private void FrmMain_Load(object sender, EventArgs e)
        {
            // Ana form açılış kodları
        }
    }
}`
  }
];
