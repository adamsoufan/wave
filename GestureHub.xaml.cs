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
using System.Windows.Media.Animation;
using System.Windows.Controls.Primitives;
using System.Printing; // For Storyboard
namespace Wave;

public partial class GestureHub : Window
{
    public GestureHub()
    {
       InitializeComponent();
        
    }

   private void OpenProfileButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }

    private void OpenHomeButton_Click(object sender, RoutedEventArgs e)
    {
        
        MainWindow home = new MainWindow();
        home.Show();
        this.Close(); // Hide the current window
    }

    private void OpenMacroHubButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }

     private void OpenAboutButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
    }
     private void LogoutButton_Click(object sender, RoutedEventArgs e)
    {
        
        //MacroHub macroHub = new MacroHub();
        //macroHub.Show();
        //this.Close(); // Hide the current window
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

 


    //changes image source
    private void ChangeImage(string imageName, string imagePath)
    {
        Image img = this.FindName(imageName) as Image;
        if (img != null)
        {
            img.Source = new BitmapImage(new Uri(imagePath, UriKind.Relative));
        }
    }



    private void Image_MouseMove(object sender, MouseEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed && sender is Image image)
        {
            if (image.Source != null)
            {
                // Create a DataObject with the correct type
                DataObject data = new DataObject(typeof(ImageSource), image.Source);

                // Start drag-and-drop with copy effect
                DragDrop.DoDragDrop(image, data, DragDropEffects.Copy);
            }
        }
    }

    private void Slot_Drop(object sender, DragEventArgs e)
    {
        
        

        if (e.Data.GetDataPresent(typeof(ImageSource)))
        {
            ImageSource droppedImage = e.Data.GetData(typeof(ImageSource)) as ImageSource;

            if (sender is Border border)
            {
                // Try casting child to Image directly
                if (border.Child is Image image)
                {
                    image.Source = droppedImage;
                    
                }
            }
        }
    }




















}

