using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Windows.Media.Animation; // For Storyboard
namespace Wave;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class GestureHub : Window
{
    public GestureHub()
    {
       InitializeComponent();
        
    }

    private void Button_Click(object sender, RoutedEventArgs e)
    {
    MessageBox.Show("You clicked the button!");
    }

    // Expands the menu when mouse enters
        private void SideMenu_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            // Start the expand animation
            (this.Resources["ExpandMenu"] as Storyboard).Begin();
        }

        // Collapses the menu when mouse leaves
        private void SideMenu_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            // Start the collapse animation
            (this.Resources["CollapseMenu"] as Storyboard).Begin();
        }
}

